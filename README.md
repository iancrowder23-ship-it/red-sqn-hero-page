<div align="center">

<img src="assets/logo.png" alt="Red Squadron" width="120" />

<br>

# RED SQUADRON

<p>Joint Special Operations Command — Milsim Web Platform</p>

<br>

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-dc2626?style=flat-square)](LICENSE)

</div>

<br>

---

<br>

A high-fidelity web platform built for the Red Squadron milsim community. Features a glassmorphic dark UI, dynamic content management via an integrated admin dashboard, secure session-based authentication with MFA, and a live operator roster system — all driven by a lightweight SQLite backend with zero external dependencies.

<br>

---

<br>

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Content Management](#content-management)
- [Deployment](#deployment)
- [Security](#security)

<br>

---

## Features

**Frontend**

- Glassmorphism dark UI with animated gradient orbs and smooth parallax
- `clamp()`-based fluid typography, CSS Grid/Flexbox for all layouts
- Entrance animations with staggered delays, spring easing, and hover micro-interactions
- Fully responsive from mobile to ultrawide

**Backend & Data**

- All public content (roster, operations, site info) is database-driven — no hardcoded data
- Admin panel for managing roster entries, mission logs, site text, and user accounts
- Portrait image uploads stored in `assets/roster/` via Multer
- About page operator count synced live from the database

**Authentication & Security**

- Session-based auth with bcrypt password hashing
- Time-based One-Time Password (TOTP) MFA via `otplib`, with QR code setup flow
- Rate limiting and account lockout after repeated failed login attempts
- Honeypot bot detection on the login form
- Adaptive authentication warning on new device/IP detection
- Helmet.js secure headers
- Role-based access control (user / admin)

<br>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Auth | express-session, bcrypt, otplib |
| File Uploads | Multer |
| Security | Helmet, express-rate-limit |
| Fonts | Google Fonts — Outfit, Inter |

<br>

---

## Project Structure

```
red-sqn-hero-page/
│
├── index.html              # Landing page with hero + bento grid
├── about.html              # Manifesto and live stats
├── roster.html             # Operator cards with portrait banners
├── operations.html         # Mission logs and AARs
├── account.html            # User settings, MFA, password change
├── admin.html              # Admin command center
├── login.html              # Secure authentication portal
│
├── css/
│   ├── style.css           # Global design system and tokens
│   ├── admin.css           # Admin panel layout and components
│   ├── roster.css          # Roster grid and operator cards
│   └── operations.css      # Operations log styles
│
├── assets/
│   ├── logo.png
│   ├── favicon.png
│   └── roster/             # Uploaded operator portraits
│
├── routes/
│   ├── api.js              # Public + admin CRUD endpoints
│   └── auth.js             # Login, MFA, session, password routes
│
├── server.js               # Express app entry point
├── database.js             # SQLite connection, schema, and seed data
├── database.sqlite         # Local database (git-ignored)
└── package.json
```

<br>

---

## Getting Started

**Prerequisites:** Node.js v16 or higher, Git.

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/red-sqn-hero-page.git
cd red-sqn-hero-page

# Install dependencies
npm install

# Start the development server
npm run dev
```

The server starts on `http://localhost:8080`. On first boot, `database.js` automatically creates the SQLite schema and seeds it with default content.

**Default admin credentials — change these immediately:**

```
username: admin
password: admin123
```

<br>

---

## Content Management

No code changes are needed to update the site. Everything is managed through the admin panel.

1. Navigate to `/login.html` and authenticate
2. Go to **Account Settings** → **Open Admin Panel**
3. Use the sidebar to access:

| Module | What you can manage |
|---|---|
| **Dashboard** | Live stats and system log |
| **Site Info** | About text, bento box copy, page headers, stats |
| **Roster** | Add, edit, delete operators; upload portrait images |
| **Operations** | Create and manage mission logs and AARs |
| **Users** | Assign admin roles, delete accounts |

<br>

---

## Deployment

### 1 — Environment

Create a `.env` file or export variables in your shell:

```bash
PORT=8080
SESSION_SECRET=your_long_random_secret_here
```

### 2 — Run

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### 3 — Process Manager (recommended)

```bash
npm install -g pm2
pm2 start server.js --name red-squadron
pm2 save
pm2 startup
```

### 4 — Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 5M;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Then obtain a certificate:

```bash
sudo certbot --nginx -d yourdomain.com
```

<br>

---

## Security

| Mechanism | Implementation |
|---|---|
| Password storage | bcrypt, 10 salt rounds |
| Session management | express-session with signed cookies |
| MFA | TOTP (RFC 6238) via otplib, QR code provisioning |
| Brute force protection | 5-attempt lockout + 15-min IP rate limit |
| Bot mitigation | Honeypot field on login form |
| Secure headers | Helmet.js |
| Adaptive auth | Warning triggered on new IP or user agent |
| Access control | Role-checked middleware on all admin routes |

<br>

---

<div align="center">

<br>

*"Execute where others cannot."*

<br>

Built for **Red Squadron** — Joint Special Operations Command

</div>
