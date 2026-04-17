<div align="center">
  <img src="assets/logo.png" alt="Red Squadron Logo" width="150" />
  
  # Red Squadron
  **Joint Special Operations Command — Milsim Landing Page**
  
  A sleek, modern, and highly-dynamic web application designed for the Red Squadron military simulation community. Built with premium tech-startup aesthetics, glassmorphism UI, and centralized data management.
</div>

---

## ⚡ Features

- **Modern Glassmorphism UI**: High-end visual design with deep dark modes, custom color palettes (Tribe Red & Tribe Gold), and animated gradient orbs.
- **Dynamic Content Management**: A single source of truth (`js/data.js`) powers the entire site — update roster, operations, and site text without touching HTML.
- **Automated Calculations**: JavaScript automatically calculates "Time in Service" for all members based on their enlistment date.
- **Interactive Roster**: 15-slot operator roster with glass cards and staggered entrance animations.
- **Operations Log**: Discord-forum-style feed of classified after-action reports and mission logs.
- **Responsive Design**: Built with `clamp()` typography and CSS Grid/Flexbox for all screen sizes.

---

## 🛠️ Tech Stack

- **HTML5** — Semantic, accessible structure
- **CSS3** — Vanilla CSS, keyframe animations, CSS custom properties, glassmorphism
- **Vanilla JavaScript** — DOM manipulation, dynamic rendering, CSS var-driven parallax
- **Node.js / npx** — Zero-install static file server via `npx serve`

---

## 📂 Project Structure

```text
RED-ASQN-04-16-26/
├── index.html          # Landing page (hero + bento grid)
├── about.html          # Manifesto + stats
├── roster.html         # Operator roster
├── operations.html     # Mission logs and after-action reports
│
├── css/
│   ├── style.css       # Global design system, tokens, animations
│   ├── roster.css      # Roster-specific layouts
│   └── operations.css  # Operations-specific layouts
│
├── js/
│   └── data.js         # ⚠️ CORE CONFIG — edit this to update all site content
│
├── assets/
│   ├── logo.png        # Main brand asset
│   └── favicon.png     # Circular favicon
│
├── tools/              # Dev utilities (not served to the web)
│   ├── main.py         # Python fallback server
│   ├── make_favicon.py # Favicon generator script
│   └── make_roster.py  # Roster HTML generator (legacy)
│
├── package.json        # npm scripts for local serving
├── .gitignore
└── README.md
```

---

## ⚙️ How to Update Content

You do **not** need to edit the HTML files. Everything is controlled via `js/data.js`.

1. Open `js/data.js` in your editor.
2. **Global settings**: Update `DISCORD_LINK` or `SITE_INFO.about` text at the top.
3. **Update roster**: Edit entries in the `ROSTER` array. "Time in Service" is auto-calculated.
4. **Post an operation**: Copy an existing block in the `OPERATIONS` array, paste it at the top, and fill in the details.

---

## 🚀 Deployment Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed on the server (v16+ recommended)
- Git installed

### 1 — First-time setup on the server

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git red-squadron
cd red-squadron
```

### 2 — Run the site

```bash
# Production (port 8080)
npm start

# Or development (port 3000, hot-friendly)
npm run dev
```

> `npx serve` is fetched automatically on first run — no `npm install` needed.

### 3 — Updating after a push

```bash
cd red-squadron
git pull
# Server will serve the new files immediately (no restart needed for static content)
```

### 4 — Keep it running with PM2 (optional but recommended)

```bash
npm install -g pm2
pm2 start "npm start" --name red-squadron
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### Nginx Reverse Proxy (recommended for production)

If you want the site at a domain (e.g., `redsqn.example.com`) with HTTPS, put this in your nginx config:

```nginx
server {
    listen 80;
    server_name redsqn.example.com;

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

Then run `sudo certbot --nginx -d redsqn.example.com` for free HTTPS via Let's Encrypt.

---

### Python Fallback (no Node.js)

If Node is not available, you can use the included Python server:

```bash
cd red-squadron
python tools/main.py
# Opens at http://localhost:8000
```

---

<div align="center">
  <i>"Execute where others cannot."</i><br>
  Built for <b>Red Squadron</b>
</div>
