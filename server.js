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

// Security Middleware: Helmet for headers (including HSTS)
app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP for simplicity in local dev, but should be enabled in prod
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Secure Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'red-squadron-super-secret-key-change-in-prod',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Make session info available to views
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { id: req.session.userId, username: req.session.username, role: req.session.role } : null;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);

const apiRoutes = require('./routes/api');
app.use('/api/data', apiRoutes);

// Static file serving
// Serve the HTML files directly from the root
app.use(express.static(path.join(__dirname, '/')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
