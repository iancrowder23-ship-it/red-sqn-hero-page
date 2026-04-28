const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const otplib = require('otplib');
const qrcode = require('qrcode');
const db = require('../database');

const router = express.Router();

// ── Rate limiter for all auth endpoints ───────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,
    message: { error: 'Too many attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

// Slightly more lenient limiter for MFA (same window, same max)
const mfaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,   // 10 MFA attempts per 15 min (brute-force unfeasible)
    message: { error: 'Too many MFA attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// MFA pending session TTL in ms (5 minutes)
const MFA_PENDING_TTL = 5 * 60 * 1000;

// ── Helper: check account lockout ─────────────────────────────────────────────
const checkLockout = (user) => {
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return true;
    }
    return false;
};

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', authLimiter, (req, res) => {
    const { username, password, honeypot } = req.body;

    // Bot detection: honeypot field must be empty
    if (honeypot) {
        return res.status(403).json({ error: 'Bot detected.' });
    }

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials.' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            // Generic message to prevent account enumeration
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // If lockout has naturally expired, reset failed attempts now
        if (user.locked_until && new Date(user.locked_until) <= new Date()) {
            db.run("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [user.id]);
            user.failed_attempts = 0;
            user.locked_until = null;
        }

        if (checkLockout(user)) {
            const unlockAt = new Date(user.locked_until);
            return res.status(403).json({
                error: `Account is locked. Try again after ${unlockAt.toLocaleTimeString()}.`
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            const attempts = user.failed_attempts + 1;
            if (attempts >= 5) {
                const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                db.run("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?",
                    [attempts, lockoutTime, user.id]);
                return res.status(403).json({ error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' });
            } else {
                db.run("UPDATE users SET failed_attempts = ? WHERE id = ?", [attempts, user.id]);
                return res.status(401).json({ error: 'Invalid username or password.' });
            }
        }

        // ── Adaptive auth: detect new IP / user-agent ─────────────────────
        const currentIp = req.ip;
        const currentAgent = req.get('User-Agent') || '';
        let requireExtraVerification = false;

        if (user.last_ip && (user.last_ip !== currentIp || user.last_user_agent !== currentAgent)) {
            requireExtraVerification = true;
        }

        // Reset failed attempts on successful password verification
        db.run("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_ip = ?, last_user_agent = ? WHERE id = ?",
            [currentIp, currentAgent, user.id]);

        // ── MFA check ─────────────────────────────────────────────────────
        if (user.mfa_enabled === 1) {
            // Store pending info in session with a strict TTL
            req.session.pendingMfaUserId = user.id;
            req.session.pendingMfaExpiry = Date.now() + MFA_PENDING_TTL;
            return res.json({ requireMfa: true, adaptiveWarning: requireExtraVerification });
        }

        // ── Full login success ─────────────────────────────────────────────
        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ error: 'Session error.' });
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            res.json({ success: true, message: 'Logged in successfully', adaptiveWarning: requireExtraVerification });
        });
    });
});

// ── POST /mfa/verify ──────────────────────────────────────────────────────────
router.post('/mfa/verify', mfaLimiter, (req, res) => {
    const { token } = req.body;
    const userId = req.session.pendingMfaUserId;
    const expiry = req.session.pendingMfaExpiry;

    if (!userId) return res.status(401).json({ error: 'No pending MFA session. Please log in first.' });
    if (!expiry || Date.now() > expiry) {
        delete req.session.pendingMfaUserId;
        delete req.session.pendingMfaExpiry;
        return res.status(401).json({ error: 'MFA session expired. Please log in again.' });
    }
    if (!token || !/^\d{6}$/.test(token)) {
        return res.status(400).json({ error: 'Invalid token format.' });
    }

    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'User not found.' });

        const isValid = otplib.authenticator.check(token, user.mfa_secret);
        if (isValid) {
            req.session.regenerate((sErr) => {
                if (sErr) return res.status(500).json({ error: 'Session error.' });
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.role = user.role;
                res.json({ success: true, message: 'Logged in successfully' });
            });
        } else {
            res.status(401).json({ error: 'Invalid MFA token.' });
        }
    });
});

// ── POST /mfa/setup ───────────────────────────────────────────────────────────
// Generates a new TOTP secret and stores it ONLY in the session (not DB yet).
// The secret is written to the DB only on /mfa/confirm success.
router.post('/mfa/setup', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    db.get("SELECT username FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });

        const secret = otplib.authenticator.generateSecret();
        const otpauthUrl = otplib.authenticator.keyuri(user.username, 'Red Squadron', secret);

        // Store in session — not DB — until confirmed
        req.session.pendingMfaSecret = secret;

        qrcode.toDataURL(otpauthUrl, (err, imageUrl) => {
            if (err) return res.status(500).json({ error: 'QR Code generation failed' });
            res.json({ secret, qrCode: imageUrl });
        });
    });
});

// ── POST /mfa/confirm ─────────────────────────────────────────────────────────
router.post('/mfa/confirm', mfaLimiter, (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { token } = req.body;
    const pendingSecret = req.session.pendingMfaSecret;

    if (!pendingSecret) return res.status(400).json({ error: 'No pending MFA setup. Call /mfa/setup first.' });
    if (!token || !/^\d{6}$/.test(token)) return res.status(400).json({ error: 'Invalid token format.' });

    const isValid = otplib.authenticator.check(token, pendingSecret);
    if (isValid) {
        // Now persist the secret to the DB
        db.run("UPDATE users SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?",
            [pendingSecret, req.session.userId], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to enable MFA.' });
                delete req.session.pendingMfaSecret;
                res.json({ success: true, message: 'MFA Enabled' });
            });
    } else {
        res.status(400).json({ error: 'Invalid token. Please try again.' });
    }
});

// ── POST /mfa/disable ─────────────────────────────────────────────────────────
router.post('/mfa/disable', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    db.run("UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?",
        [req.session.userId], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to disable MFA.' });
            res.json({ success: true });
        });
});

// ── POST /change-password ─────────────────────────────────────────────────────
router.post('/change-password', authLimiter, (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    if (currentPassword === newPassword) return res.status(400).json({ error: 'New password must differ from your current password.' });

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found.' });
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

        const hash = await bcrypt.hash(newPassword, 12); // increased cost factor
        db.run("UPDATE users SET password = ? WHERE id = ?", [hash, user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update password.' });

            // Invalidate the current session so all devices are forced to re-authenticate
            req.session.destroy(() => {
                res.clearCookie('sessionId');
                res.json({ success: true, message: 'Password updated. Please log in again.' });
            });
        });
    });
});

// ── POST /logout ──────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Failed to logout' });
        res.clearCookie('sessionId');
        res.json({ success: true });
    });
});

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
    if (req.session.userId) {
        db.get("SELECT mfa_enabled FROM users WHERE id = ?", [req.session.userId], (err, row) => {
            res.json({
                loggedIn: true,
                username: req.session.username,
                role: req.session.role,
                mfa_enabled: row ? !!row.mfa_enabled : false
            });
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// ── POST /forgot-password ─────────────────────────────────────────────────────
// Always returns the same response to prevent account enumeration
router.post('/forgot-password', authLimiter, (req, res) => {
    res.json({ message: 'If that account exists, a reset link has been sent to the associated email.' });
});

module.exports = router;
