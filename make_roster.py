"""Generate the full roster.html with 15 placeholder profiles."""

CALLSIGNS = [
    "Alpha", "Bravo", "Charlie", "Delta", "Echo",
    "Foxtrot", "Golf", "Hotel", "India", "Juliet",
    "Kilo", "Lima", "Mike", "November", "Oscar"
]

RANKS = [
    "SFC", "SSG", "SGT", "SPC", "PFC",
    "CPL", "SGT", "SPC", "PVT", "PFC",
    "SSG", "SGT", "SPC", "CPL", "PVT"
]

MOS_LIST = [
    "18A — Special Forces Officer",
    "18B — Weapons Sergeant",
    "18D — Medical Sergeant",
    "18E — Communications Sergeant",
    "11B — Infantryman",
    "68W — Combat Medic",
    "12B — Combat Engineer",
    "35F — Intelligence Analyst",
    "13F — Fire Support Specialist",
    "25U — Signal Support Systems",
    "18C — Engineering Sergeant",
    "92F — Petroleum Supply",
    "74D — Chemical Operations",
    "42A — Human Resources",
    "11C — Indirect Fire Infantryman"
]

ROLES = [
    "Squadron Commander", "Assistant Team Leader", "Medic",
    "Communications", "Rifleman", "Combat Medic",
    "Combat Engineer", "Intelligence Analyst", "Fire Support",
    "Signal Specialist", "Engineering Sergeant", "Logistics",
    "Chemical Specialist", "Admin Specialist", "Mortar Team Lead"
]

STATUSES = [
    "status-active", "status-active", "status-active", "status-reserve", "status-active",
    "status-active", "status-active", "status-reserve", "status-active", "status-active",
    "status-active", "status-reserve", "status-active", "status-active", "status-reserve"
]

STATUS_LABELS = [
    "Active", "Active", "Active", "Reserve", "Active",
    "Active", "Active", "Reserve", "Active", "Active",
    "Active", "Reserve", "Active", "Active", "Reserve"
]

def make_member(i):
    idx = i - 1
    num = f"{i:02d}"
    callsign = CALLSIGNS[idx]
    rank = RANKS[idx]
    mos = MOS_LIST[idx]
    role = ROLES[idx]
    status_cls = STATUSES[idx]
    status_lbl = STATUS_LABELS[idx]

    return f"""
    <!-- ===== MEMBER {i} ===== -->
    <section class="member-section" id="member-{i}" data-index="{i}">
        <div class="member-layout">
            <div class="member-info side-panel">
                <div class="member-badge">
                    <span class="rank-tag">{rank}</span>
                    <span class="status-tag {status_cls}">{status_lbl}</span>
                </div>
                <h2 class="member-name">Callsign <span class="gradient-text">{callsign}</span></h2>
                <p class="member-role">{role}</p>
                <div class="member-stats">
                    <div class="stat">
                        <span class="stat-label">MOS</span>
                        <span class="stat-value">{mos}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Time in Service</span>
                        <span class="stat-value time-in-service" data-start-date="2024-01-01">Calculating...</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Specialization</span>
                        <span class="stat-value">Placeholder</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Operations</span>
                        <span class="stat-value">Placeholder</span>
                    </div>
                </div>
            </div>
            <div class="member-portrait-wrap">
                <div class="portrait-frame">
                    <div class="portrait-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>Portrait</span>
                    </div>
                    <div class="portrait-ring"></div>
                    <div class="portrait-number">{num}</div>
                </div>
            </div>
            <div class="member-bio side-panel">
                <h3 class="bio-title">Operator Bio</h3>
                <p class="bio-text">
                    This is a placeholder bio for {callsign}. Add a short paragraph here describing their background,
                    notable achievements, or personality within the unit. Keep it personal and specific to the individual.
                </p>
                <div class="bio-divider"></div>
                <h3 class="bio-title" style="margin-top: 0;">Certifications</h3>
                <ul class="cert-list">
                    <li>Placeholder Certification</li>
                    <li>Placeholder Certification</li>
                    <li>Placeholder Certification</li>
                </ul>
            </div>
        </div>
        <div class="section-number">{num}</div>
    </section>"""

def make_dot(i, active=""):
    return f'        <a href="#member-{i}" class="rnav-dot{active}"></a>'

NAV_DOTS = "\n".join(make_dot(i+1, " active" if i == 0 else "") for i in range(15))
MEMBERS   = "\n".join(make_member(i+1) for i in range(15))

HTML = f"""<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roster | Red Squadron</title>
    <meta name="description" content="Meet the operators of Red Squadron, Joint Special Operations Command.">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="roster.css">
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&display=swap"
        rel="stylesheet">
    <link rel="icon" type="image/png" href="favicon.png">
</head>

<body>
    <div class="background-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
    </div>

    <nav class="navbar">
        <a href="index.html" class="logo">
            <img src="logo.png" alt="Red Squadron Logo" class="nav-logo-img">
            <span class="nav-logo-text">Red Squadron</span>
        </a>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="index.html#about">About</a></li>
            <li><a href="roster.html" class="active">Roster</a></li>
            <li><a href="#operations">Operations</a></li>
        </ul>
        <a href="https://discord.gg/your-invite-link" target="_blank" class="btn-nav">Enlist Now</a>
    </nav>

    <nav class="roster-nav" id="rosterNav" aria-label="Roster Navigation">
{NAV_DOTS}
    </nav>

{MEMBERS}

    <script>
        // Dynamically populate dot labels from callsign spans
        document.addEventListener('DOMContentLoaded', () => {{
            const sections = document.querySelectorAll('.member-section');
            const dots = document.querySelectorAll('.rnav-dot');
            sections.forEach((section, i) => {{
                const callsignSpan = section.querySelector('.member-name .gradient-text');
                if (callsignSpan && dots[i]) {{
                    dots[i].setAttribute('data-name', callsignSpan.textContent.trim());
                }}
            }});
        }});

        // Time in Service calculator
        document.addEventListener('DOMContentLoaded', () => {{
            const today = new Date();
            document.querySelectorAll('.time-in-service').forEach(el => {{
                const start = new Date(el.getAttribute('data-start-date'));
                const days = Math.ceil(Math.abs(today - start) / (1000 * 60 * 60 * 24));
                el.textContent = `${{days}} Days`;
            }});
        }});

        // Orb parallax
        document.addEventListener('mousemove', (e) => {{
            const orbs = document.querySelectorAll('.orb');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            orbs[0].style.transform = `translate(${{x * 60}}px, ${{y * 60}}px)`;
            orbs[1].style.transform = `translate(${{x * -60}}px, ${{y * -60}}px)`;
        }});

        // Sidebar nav active dot
        const sections = document.querySelectorAll('.member-section');
        const dots = document.querySelectorAll('.rnav-dot');
        const observer = new IntersectionObserver((entries) => {{
            entries.forEach(entry => {{
                if (entry.isIntersecting) {{
                    const idx = entry.target.dataset.index - 1;
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[idx]) dots[idx].classList.add('active');
                }}
            }});
        }}, {{ threshold: 0.5 }});
        sections.forEach(s => observer.observe(s));

        // Animate panels on scroll
        const panelObserver = new IntersectionObserver((entries) => {{
            entries.forEach(entry => {{
                if (entry.isIntersecting) {{
                    entry.target.style.animationPlayState = 'running';
                    panelObserver.unobserve(entry.target);
                }}
            }});
        }}, {{ threshold: 0.2 }});
        document.querySelectorAll('.side-panel, .member-portrait-wrap').forEach(p => panelObserver.observe(p));
    </script>
</body>

</html>"""

with open("roster.html", "w", encoding="utf-8") as f:
    f.write(HTML)

print("roster.html written successfully with 15 members.")
