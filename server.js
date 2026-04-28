const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Session secret enforcement ────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET || 'red-squadron-dev-secret-CHANGE-IN-PROD';
if (IS_PROD && SESSION_SECRET === 'red-squadron-dev-secret-CHANGE-IN-PROD') {
    console.error('[SECURITY] FATAL: SESSION_SECRET env var is not set. Refusing to start in production.');
    process.exit(1);
}

// ── Security Middleware: Helmet (CSP enabled) ─────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:    ["'self'"],
            scriptSrc:     ["'self'", "'unsafe-inline'"],   // tighten to nonces in production
            styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc:       ["'self'", "https://fonts.gstatic.com"],
            imgSrc:        ["'self'", "data:", "blob:"],
            connectSrc:    ["'self'"],
            frameSrc:      ["'none'"],
            objectSrc:     ["'none'"],
            upgradeInsecureRequests: IS_PROD ? [] : null,
        }
    },
    crossOriginEmbedderPolicy: false, // needed for fonts/images from CDN
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Secure Session Management ─────────────────────────────────────────────────
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
        httpOnly: true,
        secure: IS_PROD,       // enforce HTTPS in production
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
}));

// ── Global Rate Limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});
app.use(globalLimiter);

// ── Expose session user to views ──────────────────────────────────────────────
app.use((req, res, next) => {
    res.locals.user = req.session.userId
        ? { id: req.session.userId, username: req.session.username, role: req.session.role }
        : null;
    next();
});

// ── Block direct access to sensitive server-side files ────────────────────────
const BLOCKED_PATHS = [/\.sqlite$/i, /\.js$/i, /^\/routes\//i, /^\/node_modules\//i, /^\/\.git\//i];
app.use((req, res, next) => {
    const url = req.path.toLowerCase();
    // Allow /api routes through; block raw file access to sensitive extensions
    if (req.path.startsWith('/api/')) return next();
    if (BLOCKED_PATHS.some(re => re.test(url))) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

const apiRoutes = require('./routes/api');
app.use('/api/data', apiRoutes);

// ── Static file serving (HTML, CSS, assets only) ─────────────────────────────
app.use(express.static(path.join(__dirname, '/'), {
    index: 'index.html',
    // dotfiles blocked by default
    dotfiles: 'deny',
    setHeaders(res, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        // Explicitly deny serving JS server files and the database
        const blocked = ['.sqlite', '.sqlite3', '.db'];
        if (blocked.includes(ext)) {
            res.status(403).end('Forbidden');
        }
    }
}));

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!IS_PROD) {
        console.warn('[SECURITY] Running in development mode. SESSION_SECRET is using an insecure default.');
    }
});
