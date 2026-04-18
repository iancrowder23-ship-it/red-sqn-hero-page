<div align="center">
  <img src="assets/logo.png" alt="Red Squadron Logo" width="150" />
  
  # Red Squadron
  **Joint Special Operations Command — Milsim Landing Page**
  
  A sleek, modern, and highly-dynamic web application designed for the Red Squadron military simulation community. Built with premium tech-startup aesthetics, glassmorphism UI, a custom Express backend, and a fully featured Admin Panel for centralized data management.
</div>

---

## ⚡ Features

- **Modern Glassmorphism UI**: High-end visual design with deep dark modes, custom color palettes (Tribe Red & Tribe Gold), and animated gradient orbs.
- **Admin Command Center**: Secure, restricted-access admin dashboard. Easily manage site settings, operator rosters, and after-action reports via a graphical interface.
- **Dynamic Content Management**: Fully database-driven backend. Changes made in the Admin Panel instantly reflect on the public site.
- **Integrated Image Uploads**: Add custom portrait photos directly to roster profiles using the admin file uploader.
- **Interactive Roster & Operations Log**: 15-slot operator roster with glass cards and a Discord-forum-style feed for mission logs.
- **Responsive Design**: Built with `clamp()` typography and CSS Grid/Flexbox for all screen sizes.
- **Secure Authentication**: Session-based auth with rate limiting and secure headers to protect the admin routes.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom properties, keyframes, glassmorphism), Vanilla JavaScript (DOM manipulation, fetch API).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3.
- **Security & Utilities**: Express-Session, Helmet, Express-Rate-Limit, Bcrypt (password hashing), Multer (file uploads).

---

## 📂 Project Structure

```text
RED-ASQN-04-16-26/
├── index.html          # Landing page
├── about.html          # Manifesto + stats
├── roster.html         # Operator roster
├── operations.html     # Mission logs and AARs
├── account.html        # User account & MFA settings
├── admin.html          # Admin Command Center dashboard
├── login.html          # Secure login portal
│
├── css/                # Stylesheets
├── assets/             # Brand assets and uploaded roster images
├── routes/             # Express.js API routers
│   ├── api.js          # CRUD endpoints for site data
│   └── auth.js         # Authentication endpoints
│
├── server.js           # Express app entry point
├── database.js         # SQLite connection and auto-migration
├── database.sqlite     # Local database (ignored in git)
├── package.json        # Dependencies
└── README.md
```

---

## ⚙️ How to Update Content

You do **not** need to touch any code to update the website.

1. Navigate to `/login.html` and log in with your admin credentials. 
   *(Default on first launch: `admin` / `admin123`. **Change this immediately!**)*
2. Go to your Account Settings and click **Go to Admin Panel**.
3. Use the **Site Info**, **Roster**, and **Operations** tabs to modify the live site content.
4. Upload images directly via the "Add Operator" modal.

---

## 🚀 Deployment Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed on the server (v16+ recommended).
- Git installed.

### 1 — Clone and Install

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git red-squadron
cd red-squadron

# Install dependencies
npm install
```

### 2 — Configure Environment Variables

Create a `.env` file or export variables directly in your environment:
```bash
export PORT=8080
export SESSION_SECRET="your_very_long_and_random_secret_key_here"
```

### 3 — Run the Server

```bash
# Production mode
npm start

# Or development mode
npm run dev
```

> **Note on Initial Boot**: When the server runs for the very first time, `database.js` will automatically create the required SQLite tables and seed them with default data.

### 4 — Keep it running with PM2 (recommended)

```bash
npm install -g pm2
pm2 start server.js --name red-squadron
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### Nginx Reverse Proxy (recommended for production)

If you want the site at a domain (e.g., `redsqn.example.com`) with HTTPS:

```nginx
server {
    listen 80;
    server_name redsqn.example.com;

    # Important: Increase client_max_body_size if uploading large portrait images
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

Then run `sudo certbot --nginx -d redsqn.example.com` for free HTTPS via Let's Encrypt.

---

<div align="center">
  <i>"Execute where others cannot."</i><br>
  Built for <b>Red Squadron</b>
</div>
