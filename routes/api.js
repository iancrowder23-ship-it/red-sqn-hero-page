const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

// ── Multer: portrait upload with MIME type validation ─────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../assets/roster'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Force safe extension from the MIME type, not user-supplied filename
        const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype] || '.bin';
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
    fileFilter(req, file, cb) {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    }
});

// ── Middleware: require authenticated session ─────────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
}

// ── Middleware: require admin role ────────────────────────────────────────────
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
    }
    next();
}

// ── Multer error handler ──────────────────────────────────────────────────────
function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError || err.message.startsWith('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
}

// =============================================================================
// PUBLIC ROUTES (no auth required)
// =============================================================================

// Get Site Info
router.get('/site_info', (req, res) => {
    db.get("SELECT data FROM site_info WHERE id = 1", (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Database error' });
        res.json(JSON.parse(row.data));
    });
});

// Get Roster
router.get('/roster', (req, res) => {
    db.all("SELECT * FROM roster", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const processedRows = rows.map(r => ({
            ...r,
            certifications: JSON.parse(r.certifications || '[]')
        }));
        res.json(processedRows);
    });
});

// Get Operations (completed AARs — public)
router.get('/operations', (req, res) => {
    db.all("SELECT * FROM operations ORDER BY date DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const processedRows = rows.map(r => ({
            ...r,
            participants: JSON.parse(r.participants || '[]'),
            tags: JSON.parse(r.tags || '[]')
        }));
        res.json(processedRows);
    });
});

// =============================================================================
// AUTH-GATED ROUTES (logged-in users only)
// =============================================================================

// Get Operation Plans (members only)
router.get('/plans', requireAuth, (req, res) => {
    db.all("SELECT * FROM operation_plans ORDER BY planned_date ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const processed = rows.map(r => ({
            ...r,
            participants: JSON.parse(r.participants || '[]')
        }));
        res.json(processed);
    });
});

// Create Operation Plan (any logged-in member can propose)
router.post('/plans', requireAuth, (req, res) => {
    const { title, planned_date, theater, type, commander, briefing, participants } = req.body;
    if (!title || !planned_date) return res.status(400).json({ error: 'Title and planned date are required.' });

    let partsJson = '[]';
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[')
            ? participants
            : JSON.stringify(participants ? participants.split(',').map(s => s.trim()).filter(Boolean) : []);
    } catch (e) {}

    const stmt = db.prepare(
        "INSERT INTO operation_plans (title, planned_date, theater, type, commander, briefing, participants, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'planning', ?, datetime('now'))"
    );
    stmt.run([title, planned_date, theater, type, commander, briefing, partsJson, req.session.username], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to create plan.' });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// Update Operation Plan (admin only)
router.put('/plans/:id', requireAdmin, (req, res) => {
    const { title, planned_date, theater, type, commander, briefing, participants, status } = req.body;

    const ALLOWED_STATUSES = ['planning', 'approved', 'cancelled'];
    const safeStatus = ALLOWED_STATUSES.includes(status) ? status : 'planning';

    let partsJson = '[]';
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[')
            ? participants
            : JSON.stringify(participants ? participants.split(',').map(s => s.trim()).filter(Boolean) : []);
    } catch (e) {}

    db.run(
        "UPDATE operation_plans SET title=?, planned_date=?, theater=?, type=?, commander=?, briefing=?, participants=?, status=? WHERE id=?",
        [title, planned_date, theater, type, commander, briefing, partsJson, safeStatus, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update plan.' });
            res.json({ success: true });
        }
    );
});

// Delete Operation Plan (admin only)
router.delete('/plans/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM operation_plans WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete plan.' });
        res.json({ success: true });
    });
});

// =============================================================================
// ADMIN ROUTES — roster / operations / site_info
// =============================================================================

// Update Site Info
router.post('/site_info', requireAdmin, (req, res) => {
    const updatedData = req.body;
    db.run("UPDATE site_info SET data = ? WHERE id = 1", [JSON.stringify(updatedData)], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update site info' });
        res.json({ success: true });
    });
});

// Add Operator
router.post('/roster', requireAdmin, (req, res, next) => {
    upload.single('portrait')(req, res, (err) => {
        if (err) return handleUploadError(err, req, res, next);

        const { callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications } = req.body;
        const portrait = req.file ? `assets/roster/${req.file.filename}` : null;

        let certsJson = '[]';
        if (certifications) {
            try {
                certsJson = typeof certifications === 'string' && certifications.startsWith('[')
                    ? certifications
                    : JSON.stringify(certifications.split(',').map(s => s.trim()));
            } catch (e) {}
        }

        const stmt = db.prepare("INSERT INTO roster (callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications, portrait) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run([callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certsJson, portrait], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to add operator' });
            res.json({ success: true, id: this.lastID });
        });
        stmt.finalize();
    });
});

// Update Operator
router.put('/roster/:id', requireAdmin, (req, res, next) => {
    upload.single('portrait')(req, res, (err) => {
        if (err) return handleUploadError(err, req, res, next);

        const { callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications } = req.body;
        const portrait = req.file ? `assets/roster/${req.file.filename}` : undefined;

        let certsJson = '[]';
        if (certifications) {
            try {
                certsJson = typeof certifications === 'string' && certifications.startsWith('[')
                    ? certifications
                    : JSON.stringify(certifications.split(',').map(s => s.trim()));
            } catch (e) {}
        }

        let query = "UPDATE roster SET callsign=?, rank=?, status=?, role=?, mos=?, startDate=?, specialization=?, operationsCount=?, bio=?, certifications=?";
        let params = [callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certsJson];

        if (portrait !== undefined) {
            query += ", portrait=?";
            params.push(portrait);
        }

        query += " WHERE id=?";
        params.push(req.params.id);

        db.run(query, params, (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update operator' });
            res.json({ success: true });
        });
    });
});

// Delete Operator
router.delete('/roster/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM roster WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete operator' });
        res.json({ success: true });
    });
});

// Add Operation (AAR)
router.post('/operations', requireAdmin, (req, res) => {
    const { title, date, status, theater, type, commanderCallsign, summary, details, participants, tags } = req.body;

    let partsJson = '[]', tagsJson = '[]';
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[') ? participants : JSON.stringify(participants ? participants.split(',').map(s => s.trim()) : []);
        tagsJson = typeof tags === 'string' && tags.startsWith('[') ? tags : JSON.stringify(tags ? tags.split(',').map(s => s.trim()) : []);
    } catch (e) {}

    const stmt = db.prepare("INSERT INTO operations (title, date, status, theater, type, commanderCallsign, participants, summary, details, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([title, date, status, theater, type, commanderCallsign, partsJson, summary, details, tagsJson], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to add operation' });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// Update Operation (AAR)
router.put('/operations/:id', requireAdmin, (req, res) => {
    const { title, date, status, theater, type, commanderCallsign, summary, details, participants, tags } = req.body;

    let partsJson = '[]', tagsJson = '[]';
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[') ? participants : JSON.stringify(participants ? participants.split(',').map(s => s.trim()) : []);
        tagsJson = typeof tags === 'string' && tags.startsWith('[') ? tags : JSON.stringify(tags ? tags.split(',').map(s => s.trim()) : []);
    } catch (e) {}

    db.run(
        "UPDATE operations SET title=?, date=?, status=?, theater=?, type=?, commanderCallsign=?, participants=?, summary=?, details=?, tags=? WHERE id=?",
        [title, date, status, theater, type, commanderCallsign, partsJson, summary, details, tagsJson, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update operation' });
            res.json({ success: true });
        }
    );
});

// Delete Operation (AAR)
router.delete('/operations/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM operations WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete operation' });
        res.json({ success: true });
    });
});

// =============================================================================
// USER MANAGEMENT (admin only)
// =============================================================================

const ALLOWED_ROLES = ['admin', 'user'];

// Get Users
router.get('/users', requireAdmin, (req, res) => {
    db.all("SELECT id, username, role, mfa_enabled, locked_until FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Change User Role (whitelisted values only)
router.put('/users/:id/role', requireAdmin, (req, res) => {
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(', ')}` });
    }
    // Prevent self-demotion
    if (req.params.id == req.session.userId && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot demote your own account.' });
    }
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update role' });
        res.json({ success: true });
    });
});

// Delete User
router.delete('/users/:id', requireAdmin, (req, res) => {
    if (req.params.id == req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete user' });
        res.json({ success: true });
    });
});

module.exports = router;
