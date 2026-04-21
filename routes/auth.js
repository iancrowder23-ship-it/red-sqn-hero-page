const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const otplib = require('otplib');
const qrcode = require('qrcode');
const db = require('../database');

const router = express.Router();

// Specific Rate Limiter for Login/Register to prevent Brute Force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many attempts, please try again later.' }
});

// Helper: Check if account is locked
const checkLockout = (user) => {
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return true;
    }
    return false;
};

// Login Route
router.post('/login', authLimiter, (req, res) => {
    const { username, password, honeypot } = req.body;

    // Bot Detection: Honeypot field should be empty
    if (honeypot) {
        return res.status(403).json({ error: 'Bot detected.' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            // Generic error message to prevent account enumeration
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        if (checkLockout(user)) {
            return res.status(403).json({ error: 'Account is locked. Try again later.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            // Increment failed attempts
            const attempts = user.failed_attempts + 1;
            if (attempts >= 5) {
                const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                db.run("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [attempts, lockoutTime, user.id]);
                return res.status(403).json({ error: 'Account locked due to too many failed attempts.' });
            } else {
                db.run("UPDATE users SET failed_attempts = ? WHERE id = ?", [attempts, user.id]);
                return res.status(401).json({ error: 'Invalid username or password.' });
            }
        }

        // Adaptive Authentication logic: Check IP/Agent
        const currentIp = req.ip;
        const currentAgent = req.get('User-Agent');
        let requireExtraVerification = false;

        if (user.last_ip && (user.last_ip !== currentIp || user.last_user_agent !== currentAgent)) {
            requireExtraVerification = true;
            // In a full app, we would send an email/SMS alert here.
        }

        // Reset failed attempts on success
        db.run("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_ip = ?, last_user_agent = ? WHERE id = ?", 
            [currentIp, currentAgent, user.id]);

        // MFA Check
        if (user.mfa_enabled === 1) {
            // Put temp userId in session to verify MFA next
            req.session.pendingMfaUserId = user.id;
            return res.json({ requireMfa: true, adaptiveWarning: requireExtraVerification });
        }

        // Success - Set Session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ success: true, message: 'Logged in successfully', adaptiveWarning: requireExtraVerification });
    });
});

// Verify MFA
router.post('/mfa/verify', (req, res) => {
    const { token } = req.body;
    const userId = req.session.pendingMfaUserId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized. Start login first.' });

    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'User not found.' });

        const isValid = otplib.authenticator.check(token, user.mfa_secret);
        if (isValid) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            delete req.session.pendingMfaUserId;
            res.json({ success: true, message: 'Logged in successfully' });
        } else {
            res.status(401).json({ error: 'Invalid MFA token.' });
        }
    });
});

// Setup MFA
router.post('/mfa/setup', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });

        const secret = otplib.authenticator.generateSecret();
        const otpauthUrl = otplib.authenticator.keyuri(user.username, 'Red Squadron', secret);

        db.run("UPDATE users SET mfa_secret = ? WHERE id = ?", [secret, user.id], (err) => {
            if (err) return res.status(500).json({ error: 'DB Error' });

            qrcode.toDataURL(otpauthUrl, (err, imageUrl) => {
                if (err) return res.status(500).json({ error: 'QR Code generation failed' });
                res.json({ secret, qrCode: imageUrl });
            });
        });
    });
});

// Confirm MFA Setup
router.post('/mfa/confirm', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { token } = req.body;

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });

        const isValid = otplib.authenticator.check(token, user.mfa_secret);
        if (isValid) {
            db.run("UPDATE users SET mfa_enabled = 1 WHERE id = ?", [user.id]);
            res.json({ success: true, message: 'MFA Enabled' });
        } else {
            res.status(400).json({ error: 'Invalid token' });
        }
    });
});

// Disable MFA
router.post('/mfa/disable', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    db.run("UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?", [req.session.userId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to disable MFA.' });
        res.json({ success: true });
    });
});

// Change Password
router.post('/change-password', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found.' });
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });
        const hash = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hash, user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update password.' });
            res.json({ success: true });
        });
    });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Failed to logout' });
        res.clearCookie('sessionId');
        res.json({ success: true });
    });
});

// Check Session state
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

// Password Recovery (Mock implementation for Enumeration prevention)
router.post('/forgot-password', authLimiter, (req, res) => {
    // We always return the same message regardless of whether the email/user exists
    res.json({ message: 'If that account exists, a reset link has been sent to the associated email.' });
});

module.exports = router;
