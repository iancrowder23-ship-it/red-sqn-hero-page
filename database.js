const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'user',
                mfa_secret TEXT,
                mfa_enabled INTEGER DEFAULT 0,
                failed_attempts INTEGER DEFAULT 0,
                locked_until DATETIME,
                last_ip TEXT,
                last_user_agent TEXT
            )`);

            // Default admin account
            db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
                if (!row) {
                    const hash = bcrypt.hashSync("admin123", 12);
                    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", hash, "admin"]);
                    console.warn('╔══════════════════════════════════════════════════════╗');
                    console.warn('║  [SECURITY] Default admin created: admin / admin123  ║');
                    console.warn('║  CHANGE THIS PASSWORD IMMEDIATELY via Account page.  ║');
                    console.warn('╚══════════════════════════════════════════════════════╝');
                }
            });

            // Site Info Table (Key-Value or just a single row with JSON data)
            db.run(`CREATE TABLE IF NOT EXISTS site_info (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT
            )`);

            // Roster Table
            db.run(`CREATE TABLE IF NOT EXISTS roster (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                callsign TEXT,
                rank TEXT,
                status TEXT,
                role TEXT,
                mos TEXT,
                startDate TEXT,
                specialization TEXT,
                operationsCount TEXT,
                bio TEXT,
                certifications TEXT,
                portrait TEXT
            )`);

            // Operations Table (completed AARs)
            db.run(`CREATE TABLE IF NOT EXISTS operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                date TEXT,
                status TEXT,
                theater TEXT,
                type TEXT,
                commanderCallsign TEXT,
                participants TEXT,
                summary TEXT,
                details TEXT,
                tags TEXT
            )`);

            // Operation Plans Table (upcoming / in-planning ops)
            db.run(`CREATE TABLE IF NOT EXISTS operation_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                planned_date TEXT,
                theater TEXT,
                type TEXT,
                commander TEXT,
                briefing TEXT,
                participants TEXT DEFAULT '[]',
                status TEXT DEFAULT 'planning',
                created_by TEXT,
                created_at DATETIME DEFAULT (datetime('now'))
            )`);

            // Seed Site Info
            db.get("SELECT * FROM site_info WHERE id = 1", (err, row) => {
                if (!row) {
                    const initialSiteInfo = {
                        name: "Red Squadron",
                        tagline: "Joint Special Operations Command",
                        description: "Join the premier simulation community. Authentic tactics. Cohesive teamwork. Unforgettable experiences.",
                        about: "Red Squadron is an elite unit of the Joint Special Operations Command (JSOC), operating \n        across complex, high-stakes environments. Founded on the principles of discipline, \n        adaptability, and precision — we execute where others cannot.\n        <br><br>\n        Our operators represent the finest in tactical simulation, bringing diverse specializations\n        together under a single chain of command. Every mission is planned meticulously and executed \n        with ruthless efficiency.\n        <br><br>\n        Whether you're a seasoned operator or eager to prove yourself, Red Squadron has a place \n        for those who meet our standard.",
                        stats: [
                            { value: "2024", label: "Established" },
                            { value: "15+", label: "Active Operators" },
                            { value: "100%", label: "Mission Focus" }
                        ],
                        bentoBoxes: {
                            roster: { title: "Elite Roster", description: "Meet the operators executing high-stakes missions." },
                            operations: { title: "Operations Log", description: "Declassified AARs from recent deployments." }
                        },
                        pageHeaders: {
                            roster: { badge: "Active Personnel", titleNormal: "Elite", titleHighlight: "Roster", subtitle: "Meet the operators executing high-stakes missions." },
                            operations: { badge: "After-Action Reports", titleNormal: "Operations", titleHighlight: "Log", subtitle: "Classified mission records of Red Squadron." },
                            about: { badge: "The Manifesto", titleNormal: "About", titleHighlight: "Us" }
                        }
                    };
                    db.run("INSERT INTO site_info (id, data) VALUES (1, ?)", [JSON.stringify(initialSiteInfo)]);
                }
            });

            // Seed Roster (if empty)
            db.get("SELECT count(*) as count FROM roster", (err, row) => {
                if (row && row.count === 0) {
                    const initialRoster = [
                        { callsign: "Alpha - 1", rank: "E8 — Senior Chief Petty Officer", status: "active", role: "Team Lead", mos: "18A — Special Forces Officer", startDate: "2024-04-16", specialization: "Placeholder", operationsCount: "Placeholder", bio: "This is a placeholder bio for Alpha. Add a short paragraph here describing their background, notable achievements, or personality within the unit.", certifications: JSON.stringify(["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"]), portrait: null },
                        { callsign: "Bravo", rank: "SSG", status: "active", role: "Assistant Team Leader", mos: "18B — Weapons Sergeant", startDate: "2024-04-16", specialization: "Placeholder", operationsCount: "Placeholder", bio: "Placeholder bio for Bravo.", certifications: JSON.stringify(["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"]), portrait: null }
                    ]; // Seeding just a few, user can add more from admin panel
                    const stmt = db.prepare("INSERT INTO roster (callsign, rank, status, role, mos, startDate, specialization, operationsCount, bio, certifications, portrait) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    initialRoster.forEach(op => {
                        stmt.run(op.callsign, op.rank, op.status, op.role, op.mos, op.startDate, op.specialization, op.operationsCount, op.bio, op.certifications, op.portrait);
                    });
                    stmt.finalize();
                }
            });

            // Seed Operations (if empty)
            db.get("SELECT count(*) as count FROM operations", (err, row) => {
                if (row && row.count === 0) {
                    const initialOps = [
                        { title: "Operation Iron Veil", date: "2025-11-12", status: "success", theater: "Eastern Europe", type: "Direct Action", commanderCallsign: "Alpha - 1", participants: JSON.stringify(["Alpha - 1", "Bravo", "Charlie", "Delta"]), summary: "Successful interdiction of a high-value target convoy operating along the northern supply corridor. Team breached the compound under cover of darkness and neutralized all resistance within 4 minutes of first contact.", details: "Phase 1 — Infiltration: Team inserted via HALO jump 8km from the objective. \n            Movement to target was uneventful. No enemy contact during approach.\n            <br><br>\n            Phase 2 — Assault: Simultaneous breach on two entry points. Primary team cleared \n            the main structure while secondary element held the perimeter. Three HVTs were \n            captured alive for questioning.\n            <br><br>\n            Phase 3 — Exfil: Extraction helicopter arrived on time. Minor small arms fire \n            during exfil was suppressed by door gunners. All personnel returned safely.", tags: JSON.stringify(["Direct Action", "HVT", "Night Op", "HALO"]) }
                    ];
                    const stmt = db.prepare("INSERT INTO operations (title, date, status, theater, type, commanderCallsign, participants, summary, details, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    initialOps.forEach(op => {
                        stmt.run(op.title, op.date, op.status, op.theater, op.type, op.commanderCallsign, op.participants, op.summary, op.details, op.tags);
                    });
                    stmt.finalize();
                }
            });
        });
    }
});

module.exports = db;
