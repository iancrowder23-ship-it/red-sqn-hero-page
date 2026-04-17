// ================================================================
//  RED SQUADRON — SITE DATA
//  Edit this file to update content across the entire website.
//  DO NOT rename variables, only change values inside quotes/arrays.
// ================================================================

// --- GLOBAL ---
const DISCORD_LINK = "https://discord.gg/your-invite-link";

const SITE_INFO = {
    name: "Red Squadron",
    tagline: "Joint Special Operations Command",
    description: "Join the premier simulation community. Authentic tactics. Cohesive teamwork. Unforgettable experiences.",
    about: `
        Red Squadron is an elite unit of the Joint Special Operations Command (JSOC), operating 
        across complex, high-stakes environments. Founded on the principles of discipline, 
        adaptability, and precision — we execute where others cannot.
        <br><br>
        Our operators represent the finest in tactical simulation, bringing diverse specializations
        together under a single chain of command. Every mission is planned meticulously and executed 
        with ruthless efficiency.
        <br><br>
        Whether you're a seasoned operator or eager to prove yourself, Red Squadron has a place 
        for those who meet our standard.
    `
};

// --- ROSTER ---
// To update a member: change values below.
// status: "active" or "reserve"
// portrait: null (placeholder) or "images/member1.jpg" (add photo to /images/ folder)
// certifications: list of strings
const ROSTER = [
    {
        id: 1,
        callsign: "Alpha - 1",
        rank: "E8 — Senior Chief Petty Officer",
        status: "active",
        role: "Team Lead",
        mos: "18A — Special Forces Officer",
        startDate: "2024-04-16",   // YYYY-MM-DD — used to calculate Time in Service
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "This is a placeholder bio for Alpha. Add a short paragraph here describing their background, notable achievements, or personality within the unit.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 2,
        callsign: "Bravo",
        rank: "SSG",
        status: "active",
        role: "Assistant Team Leader",
        mos: "18B — Weapons Sergeant",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Bravo.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 3,
        callsign: "Charlie",
        rank: "SGT",
        status: "active",
        role: "Medic",
        mos: "18D — Medical Sergeant",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Charlie.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 4,
        callsign: "Delta",
        rank: "SPC",
        status: "reserve",
        role: "Communications",
        mos: "18E — Communications Sergeant",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Delta.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 5,
        callsign: "Echo",
        rank: "PFC",
        status: "active",
        role: "Rifleman",
        mos: "11B — Infantryman",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Echo.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 6,
        callsign: "Foxtrot",
        rank: "CPL",
        status: "active",
        role: "Combat Medic",
        mos: "68W — Combat Medic",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Foxtrot.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 7,
        callsign: "Golf",
        rank: "SGT",
        status: "active",
        role: "Combat Engineer",
        mos: "12B — Combat Engineer",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Golf.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 8,
        callsign: "Hotel",
        rank: "SPC",
        status: "reserve",
        role: "Intelligence Analyst",
        mos: "35F — Intelligence Analyst",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Hotel.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 9,
        callsign: "India",
        rank: "PVT",
        status: "active",
        role: "Fire Support",
        mos: "13F — Fire Support Specialist",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for India.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 10,
        callsign: "Juliet",
        rank: "PFC",
        status: "active",
        role: "Signal Specialist",
        mos: "25U — Signal Support Systems",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Juliet.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 11,
        callsign: "Kilo",
        rank: "SSG",
        status: "active",
        role: "Engineering Sergeant",
        mos: "18C — Engineering Sergeant",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Kilo.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 12,
        callsign: "Lima",
        rank: "SGT",
        status: "reserve",
        role: "Logistics",
        mos: "92F — Petroleum Supply",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Lima.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 13,
        callsign: "Mike",
        rank: "SPC",
        status: "active",
        role: "Chemical Specialist",
        mos: "74D — Chemical Operations",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Mike.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 14,
        callsign: "November",
        rank: "CPL",
        status: "active",
        role: "Admin Specialist",
        mos: "42A — Human Resources",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for November.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    },
    {
        id: 15,
        callsign: "Oscar",
        rank: "PVT",
        status: "reserve",
        role: "Mortar Team Lead",
        mos: "11C — Indirect Fire Infantryman",
        startDate: "2024-04-16",
        specialization: "Placeholder",
        operationsCount: "Placeholder",
        bio: "Placeholder bio for Oscar.",
        certifications: ["Placeholder Certification", "Placeholder Certification", "Placeholder Certification"],
        portrait: null
    }
];

// --- OPERATIONS ---
// status: "success" | "failure" | "ongoing" | "classified"
// participants: array of callsign strings (must match ROSTER callsigns)
// tags: array of tag strings
// Add new operations by copying a block and pasting it above.
const OPERATIONS = [
    {
        id: 1,
        title: "Operation Iron Veil",
        date: "2025-11-12",
        status: "success",
        theater: "Eastern Europe",
        type: "Direct Action",
        commanderCallsign: "Alpha - 1",
        participants: ["Alpha - 1", "Bravo", "Charlie", "Delta"],
        summary: "Successful interdiction of a high-value target convoy operating along the northern supply corridor. Team breached the compound under cover of darkness and neutralized all resistance within 4 minutes of first contact.",
        details: `
            Phase 1 — Infiltration: Team inserted via HALO jump 8km from the objective. 
            Movement to target was uneventful. No enemy contact during approach.
            <br><br>
            Phase 2 — Assault: Simultaneous breach on two entry points. Primary team cleared 
            the main structure while secondary element held the perimeter. Three HVTs were 
            captured alive for questioning.
            <br><br>
            Phase 3 — Exfil: Extraction helicopter arrived on time. Minor small arms fire 
            during exfil was suppressed by door gunners. All personnel returned safely.
        `,
        tags: ["Direct Action", "HVT", "Night Op", "HALO"]
    },
    {
        id: 2,
        title: "Operation Steel Phantom",
        date: "2026-01-28",
        status: "success",
        theater: "North Africa",
        type: "Reconnaissance",
        commanderCallsign: "Bravo",
        participants: ["Bravo", "Echo", "Foxtrot"],
        summary: "Long-range reconnaissance patrol to assess enemy fortification levels along the coastal ridge. Intelligence gathered was used to plan a follow-on strike by air assets.",
        details: `
            Three-operator patrol inserted by boat and moved 14km overland to observation post. 
            72-hour observation window provided full shift schedules, vehicle movements, and 
            approximate strength of ~40 personnel. No enemy contact made. Exfil via extraction 
            vehicle at pre-designated pick-up site.
        `,
        tags: ["Reconnaissance", "LRSP", "Maritime", "Intel"]
    },
    {
        id: 3,
        title: "Operation Crimson Gate",
        date: "2026-03-05",
        status: "ongoing",
        theater: "Central Asia",
        type: "Personnel Recovery",
        commanderCallsign: "Alpha - 1",
        participants: ["Alpha - 1", "Charlie", "Golf", "Hotel", "Kilo"],
        summary: "Active personnel recovery operation. A downed pilot from a partner nation is currently being held at an unknown location. Red Squadron is coordinating with local assets to pinpoint position prior to extraction.",
        details: `
            CLASSIFIED — Operation is ongoing. After-action report will be filed upon completion.
            Current intelligence suggests the pilot is alive and being held at one of three 
            suspected locations. Surveillance teams are narrowing down the site.
        `,
        tags: ["Personnel Recovery", "CSAR", "Ongoing", "Coalition"]
    }
];
