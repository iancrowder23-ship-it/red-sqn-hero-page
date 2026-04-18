const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

// Multer setup for Roster Portraits
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../assets/roster'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- PUBLIC ROUTES (No auth required) ---

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

// Get Operations
router.get('/operations', (req, res) => {
    db.all("SELECT * FROM operations", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const processedRows = rows.map(r => ({
            ...r,
            participants: JSON.parse(r.participants || '[]'),
            tags: JSON.parse(r.tags || '[]')
        }));
        res.json(processedRows);
    });
});

// --- ADMIN MIDDLEWARE ---
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
    }
    next();
}

// --- ADMIN ROUTES ---

// Update Site Info
router.post('/site_info', requireAdmin, (req, res) => {
    const updatedData = req.body;
    db.run("UPDATE site_info SET data = ? WHERE id = 1", [JSON.stringify(updatedData)], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update site info' });
        res.json({ success: true });
    });
});

// Add Operator
router.post('/roster', requireAdmin, upload.single('portrait'), (req, res) => {
    const { callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications } = req.body;
    const portrait = req.file ? `assets/roster/${req.file.filename}` : null;
    
    // Parse certifications (if sent as stringified JSON or comma-separated)
    let certsJson = "[]";
    if (certifications) {
        try {
            certsJson = typeof certifications === 'string' && certifications.startsWith('[') 
                ? certifications 
                : JSON.stringify(certifications.split(',').map(s => s.trim()));
        } catch(e) {}
    }

    const stmt = db.prepare("INSERT INTO roster (callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications, portrait) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certsJson, portrait], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to add operator' });
        res.json({ success: true, id: this.lastID });
    });
});

// Update Operator
router.put('/roster/:id', requireAdmin, upload.single('portrait'), (req, res) => {
    const { callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications } = req.body;
    const portrait = req.file ? `assets/roster/${req.file.filename}` : undefined;

    let certsJson = "[]";
    if (certifications) {
        try {
            certsJson = typeof certifications === 'string' && certifications.startsWith('[') 
                ? certifications 
                : JSON.stringify(certifications.split(',').map(s => s.trim()));
        } catch(e) {}
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

// Delete Operator
router.delete('/roster/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM roster WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete operator' });
        res.json({ success: true });
    });
});

// Add Operation
router.post('/operations', requireAdmin, (req, res) => {
    const { title, date, status, theater, type, commanderCallsign, summary, details, participants, tags } = req.body;
    
    let partsJson = "[]", tagsJson = "[]";
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[') ? participants : JSON.stringify(participants ? participants.split(',').map(s=>s.trim()) : []);
        tagsJson = typeof tags === 'string' && tags.startsWith('[') ? tags : JSON.stringify(tags ? tags.split(',').map(s=>s.trim()) : []);
    } catch(e) {}

    const stmt = db.prepare("INSERT INTO operations (title, date, status, theater, type, commanderCallsign, participants, summary, details, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([title, date, status, theater, type, commanderCallsign, partsJson, summary, details, tagsJson], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to add operation' });
        res.json({ success: true, id: this.lastID });
    });
});

// Update Operation
router.put('/operations/:id', requireAdmin, (req, res) => {
    const { title, date, status, theater, type, commanderCallsign, summary, details, participants, tags } = req.body;
    
    let partsJson = "[]", tagsJson = "[]";
    try {
        partsJson = typeof participants === 'string' && participants.startsWith('[') ? participants : JSON.stringify(participants ? participants.split(',').map(s=>s.trim()) : []);
        tagsJson = typeof tags === 'string' && tags.startsWith('[') ? tags : JSON.stringify(tags ? tags.split(',').map(s=>s.trim()) : []);
    } catch(e) {}

    db.run("UPDATE operations SET title=?, date=?, status=?, theater=?, type=?, commanderCallsign=?, participants=?, summary=?, details=?, tags=? WHERE id=?", 
        [title, date, status, theater, type, commanderCallsign, partsJson, summary, details, tagsJson, req.params.id], 
        (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update operation' });
        res.json({ success: true });
    });
});

// Delete Operation
router.delete('/operations/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM operations WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete operation' });
        res.json({ success: true });
    });
});

// --- USER MANAGEMENT ROUTES ---

// Get Users
router.get('/users', requireAdmin, (req, res) => {
    db.all("SELECT id, username, role, mfa_enabled, locked_until FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Change User Role
router.put('/users/:id/role', requireAdmin, (req, res) => {
    const { role } = req.body;
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
