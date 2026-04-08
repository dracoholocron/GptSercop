/**
 * Injects 2 architecture slides (Stack + Analytics Module Map)
 * into the existing presentation HTML file.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'sercop-analytics-presentation.html');
let html = fs.readFileSync(FILE, 'utf-8');

// ─── SVG Architecture Diagram ──────────────────────────────────────
const archSVG = `<svg viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;font-family:'Segoe UI',system-ui,sans-serif">
  <defs>
    <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1d4ed8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="gPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="gOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#fb923c;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="gDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148,163,184,0.5)"/>
    </marker>
    <marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(59,130,246,0.8)"/>
    </marker>
  </defs>

  <!-- Background -->
  <rect width="900" height="480" fill="#0a0f1e" rx="16"/>

  <!-- ── LAYER LABELS ── -->
  <text x="14" y="72" fill="rgba(148,163,184,0.4)" font-size="10" font-weight="700" letter-spacing="2" transform="rotate(-90,14,72)">USERS</text>
  <text x="14" y="195" fill="rgba(148,163,184,0.4)" font-size="10" font-weight="700" letter-spacing="2" transform="rotate(-90,14,195)">FRONTEND</text>
  <text x="14" y="305" fill="rgba(148,163,184,0.4)" font-size="10" font-weight="700" letter-spacing="2" transform="rotate(-90,14,305)">BACKEND</text>
  <text x="14" y="420" fill="rgba(148,163,184,0.4)" font-size="10" font-weight="700" letter-spacing="2" transform="rotate(-90,14,420)">DATA</text>

  <!-- ══ USERS ROW ══ -->
  <!-- Admin -->
  <rect x="100" y="20" width="140" height="56" rx="12" fill="url(#gBlue)" filter="url(#shadow)"/>
  <text x="170" y="43" fill="white" font-size="18" text-anchor="middle">👤</text>
  <text x="170" y="61" fill="white" font-size="12" font-weight="600" text-anchor="middle">Administrador</text>
  <text x="170" y="73" fill="rgba(255,255,255,0.7)" font-size="10" text-anchor="middle">SERCOP</text>

  <!-- Auditor -->
  <rect x="265" y="20" width="140" height="56" rx="12" fill="url(#gPurple)" filter="url(#shadow)"/>
  <text x="335" y="43" fill="white" font-size="18" text-anchor="middle">🔍</text>
  <text x="335" y="61" fill="white" font-size="12" font-weight="600" text-anchor="middle">Auditor</text>
  <text x="335" y="73" fill="rgba(255,255,255,0.7)" font-size="10" text-anchor="middle">Contraloría</text>

  <!-- Entidad -->
  <rect x="430" y="20" width="140" height="56" rx="12" fill="url(#gGreen)" filter="url(#shadow)"/>
  <text x="500" y="43" fill="white" font-size="18" text-anchor="middle">🏢</text>
  <text x="500" y="61" fill="white" font-size="12" font-weight="600" text-anchor="middle">Entidad Pública</text>
  <text x="500" y="73" fill="rgba(255,255,255,0.7)" font-size="10" text-anchor="middle">MEC, MSP, GAD...</text>

  <!-- Ciudadano -->
  <rect x="595" y="20" width="140" height="56" rx="12" fill="url(#gOrange)" filter="url(#shadow)"/>
  <text x="665" y="43" fill="white" font-size="18" text-anchor="middle">👥</text>
  <text x="665" y="61" fill="white" font-size="12" font-weight="600" text-anchor="middle">Ciudadano</text>
  <text x="665" y="73" fill="rgba(255,255,255,0.7)" font-size="10" text-anchor="middle">Portal Público</text>

  <!-- ── Arrows Users → Frontend ── -->
  <line x1="170" y1="77" x2="255" y2="110" stroke="rgba(148,163,184,0.25)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="335" y1="77" x2="355" y2="110" stroke="rgba(148,163,184,0.25)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="500" y1="77" x2="470" y2="110" stroke="rgba(148,163,184,0.25)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="665" y1="77" x2="580" y2="110" stroke="rgba(148,163,184,0.25)" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- ══ FRONTEND ROW ══ -->
  <rect x="100" y="110" width="680" height="74" rx="14" fill="rgba(29,78,216,0.1)" stroke="rgba(59,130,246,0.3)" stroke-width="1.5"/>
  <text x="116" y="132" fill="rgba(96,165,250,0.9)" font-size="11" font-weight="700" letter-spacing="1">REACT 19 + VITE + CHAKRA UI v3 + FRAMER MOTION</text>

  <!-- Frontend boxes -->
  <rect x="114" y="138" width="110" height="34" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
  <text x="169" y="151" fill="#93c5fd" font-size="10" font-weight="600" text-anchor="middle">Analytics Hub</text>
  <text x="169" y="163" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">11 páginas</text>

  <rect x="234" y="138" width="110" height="34" rx="8" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.3)" stroke-width="1"/>
  <text x="289" y="151" fill="#d8b4fe" font-size="10" font-weight="600" text-anchor="middle">Auth + RBAC</text>
  <text x="289" y="163" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">JWT / Roles</text>

  <rect x="354" y="138" width="110" height="34" rx="8" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.3)" stroke-width="1"/>
  <text x="409" y="151" fill="#86efac" font-size="10" font-weight="600" text-anchor="middle">CP Modules</text>
  <text x="409" y="163" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Licitaciones</text>

  <rect x="474" y="138" width="110" height="34" rx="8" fill="rgba(251,146,60,0.15)" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
  <text x="529" y="151" fill="#fdba74" font-size="10" font-weight="600" text-anchor="middle">Provider Portal</text>
  <text x="529" y="163" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Ofertas / RUP</text>

  <rect x="594" y="138" width="110" height="34" rx="8" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" stroke-width="1"/>
  <text x="649" y="151" fill="#fca5a5" font-size="10" font-weight="600" text-anchor="middle">analyticsService</text>
  <text x="649" y="163" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">API Client</text>

  <!-- ── Arrows Frontend → API Gateway ── -->
  <line x1="440" y1="185" x2="440" y2="218" stroke="rgba(59,130,246,0.5)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrowBlue)"/>
  <text x="448" y="206" fill="rgba(96,165,250,0.6)" font-size="9">HTTPS / JWT</text>

  <!-- ══ BACKEND ROW ══ -->
  <rect x="100" y="220" width="680" height="120" rx="14" fill="rgba(5,150,105,0.08)" stroke="rgba(34,197,94,0.25)" stroke-width="1.5"/>
  <text x="116" y="240" fill="rgba(74,222,128,0.9)" font-size="11" font-weight="700" letter-spacing="1">NODE.JS 24 + FASTIFY v5 + PRISMA ORM v6 + TYPESCRIPT</text>

  <!-- API modules -->
  <rect x="114" y="248" width="96" height="80" rx="10" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.3)" stroke-width="1"/>
  <text x="162" y="264" fill="#fca5a5" font-size="10" font-weight="700" text-anchor="middle">🧠 Risk</text>
  <text x="162" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Engine</text>
  <text x="162" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">20 patrones</text>
  <text x="162" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">risk-engine.ts</text>
  <text x="162" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">alerts.ts</text>

  <rect x="220" y="248" width="96" height="80" rx="10" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.3)" stroke-width="1"/>
  <text x="268" y="264" fill="#d8b4fe" font-size="10" font-weight="700" text-anchor="middle">🔗 Network</text>
  <text x="268" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Graph</text>
  <text x="268" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Colusión</text>
  <text x="268" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">provider-</text>
  <text x="268" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">network.ts</text>

  <rect x="326" y="248" width="96" height="80" rx="10" fill="rgba(251,146,60,0.12)" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
  <text x="374" y="264" fill="#fdba74" font-size="10" font-weight="700" text-anchor="middle">✂️ Frag.</text>
  <text x="374" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Detector</text>
  <text x="374" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Clustering</text>
  <text x="374" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">fragmentation</text>
  <text x="374" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">.ts</text>

  <rect x="432" y="248" width="96" height="80" rx="10" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" stroke-width="1"/>
  <text x="480" y="264" fill="#86efac" font-size="10" font-weight="700" text-anchor="middle">⭐ Score</text>
  <text x="480" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Proveedor</text>
  <text x="480" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">4 dims</text>
  <text x="480" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">provider-</text>
  <text x="480" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">score.ts</text>

  <rect x="538" y="248" width="96" height="80" rx="10" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
  <text x="586" y="264" fill="#93c5fd" font-size="10" font-weight="700" text-anchor="middle">💰 Price</text>
  <text x="586" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Index</text>
  <text x="586" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Referencia</text>
  <text x="586" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">price-</text>
  <text x="586" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">index.ts</text>

  <rect x="644" y="248" width="96" height="80" rx="10" fill="rgba(250,204,21,0.12)" stroke="rgba(250,204,21,0.3)" stroke-width="1"/>
  <text x="692" y="264" fill="#fde047" font-size="10" font-weight="700" text-anchor="middle">🔮 Predict</text>
  <text x="692" y="278" fill="rgba(148,163,184,0.8)" font-size="9" text-anchor="middle">Riesgo</text>
  <text x="692" y="292" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Pre-award</text>
  <text x="692" y="306" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">predictive</text>
  <text x="692" y="320" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">.ts</text>

  <!-- ── Arrow Backend → Data ── -->
  <line x1="440" y1="341" x2="440" y2="368" stroke="rgba(34,197,94,0.5)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrowBlue)"/>
  <text x="448" y="359" fill="rgba(74,222,128,0.6)" font-size="9">Prisma ORM</text>

  <!-- ══ DATA ROW ══ -->
  <rect x="100" y="370" width="680" height="88" rx="14" fill="rgba(124,58,237,0.08)" stroke="rgba(168,85,247,0.25)" stroke-width="1.5"/>
  <text x="116" y="390" fill="rgba(196,181,253,0.9)" font-size="11" font-weight="700" letter-spacing="1">DATA LAYER</text>

  <!-- PostgreSQL -->
  <rect x="114" y="396" width="130" height="50" rx="10" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
  <text x="179" y="415" fill="white" font-size="20" text-anchor="middle">🐘</text>
  <text x="179" y="432" fill="#93c5fd" font-size="11" font-weight="700" text-anchor="middle">PostgreSQL 16</text>
  <text x="179" y="443" fill="rgba(148,163,184,0.6)" font-size="9" text-anchor="middle">Prisma schema · 35+ modelos</text>

  <!-- Redis -->
  <rect x="260" y="396" width="120" height="50" rx="10" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.3)" stroke-width="1"/>
  <text x="320" y="415" fill="white" font-size="20" text-anchor="middle">⚡</text>
  <text x="320" y="432" fill="#fca5a5" font-size="11" font-weight="700" text-anchor="middle">Redis 7</text>
  <text x="320" y="443" fill="rgba(148,163,184,0.6)" font-size="9" text-anchor="middle">Cache · Sessions</text>

  <!-- MinIO -->
  <rect x="396" y="396" width="120" height="50" rx="10" fill="rgba(251,146,60,0.12)" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
  <text x="456" y="415" fill="white" font-size="20" text-anchor="middle">📦</text>
  <text x="456" y="432" fill="#fdba74" font-size="11" font-weight="700" text-anchor="middle">MinIO (S3)</text>
  <text x="456" y="443" fill="rgba(148,163,184,0.6)" font-size="9" text-anchor="middle">Documentos · Assets</text>

  <!-- Prisma Models -->
  <rect x="532" y="396" width="240" height="50" rx="10" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" stroke-width="1"/>
  <text x="652" y="415" fill="white" font-size="20" text-anchor="middle">🗄️</text>
  <text x="652" y="432" fill="#86efac" font-size="11" font-weight="700" text-anchor="middle">Prisma ORM v6</text>
  <text x="652" y="443" fill="rgba(148,163,184,0.6)" font-size="9" text-anchor="middle">ProviderScore · PriceReference · FragmentationAlert</text>

  <!-- HTTPS label on side -->
  <text x="875" y="245" fill="rgba(148,163,184,0.3)" font-size="9" text-anchor="middle" transform="rotate(90,875,245)">REST API · v1</text>
</svg>`;

// ─── SVG Analytics Module Map ───────────────────────────────────────
const moduleMapSVG = `<svg viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;font-family:'Segoe UI',system-ui,sans-serif">
  <defs>
    <linearGradient id="mgBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1d4ed8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:1"/>
    </linearGradient>
    <filter id="mshadow">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <marker id="marr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="rgba(96,165,250,0.6)"/>
    </marker>
  </defs>

  <rect width="900" height="480" fill="#070d1a" rx="16"/>

  <!-- Central hub -->
  <circle cx="450" cy="240" r="72" fill="url(#mgBlue)" filter="url(#mshadow)" opacity="0.9"/>
  <circle cx="450" cy="240" r="72" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <text x="450" y="228" fill="white" font-size="26" text-anchor="middle">📊</text>
  <text x="450" y="250" fill="white" font-size="13" font-weight="800" text-anchor="middle">Analytics</text>
  <text x="450" y="265" fill="rgba(255,255,255,0.8)" font-size="11" text-anchor="middle">Engine</text>
  <text x="450" y="279" fill="rgba(196,181,253,0.9)" font-size="10" text-anchor="middle">routes.ts · API v1</text>

  <!-- Orbit ring -->
  <circle cx="450" cy="240" r="160" fill="none" stroke="rgba(59,130,246,0.1)" stroke-width="1" stroke-dasharray="4,6"/>
  <circle cx="450" cy="240" r="230" fill="none" stroke="rgba(59,130,246,0.06)" stroke-width="1" stroke-dasharray="2,8"/>

  <!-- ── MODULE NODES (11 modules arranged in a circle) ── -->

  <!-- M1: Dashboard (top) -->
  <line x1="450" y1="168" x2="450" y2="200" stroke="rgba(96,165,250,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="380" y="100" width="140" height="60" rx="12" fill="rgba(29,78,216,0.2)" stroke="rgba(59,130,246,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="450" y="122" fill="white" font-size="16" text-anchor="middle">📊</text>
  <text x="450" y="138" fill="#93c5fd" font-size="11" font-weight="700" text-anchor="middle">Dashboard</text>
  <text x="450" y="151" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">KPIs · Risk dist · Alerts</text>

  <!-- M2: Risk Scores (top-right) -->
  <line x1="511" y1="191" x2="487" y2="209" stroke="rgba(239,68,68,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="578" y="86" width="150" height="60" rx="12" fill="rgba(127,29,29,0.25)" stroke="rgba(239,68,68,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="653" y="108" fill="white" font-size="16" text-anchor="middle">🎯</text>
  <text x="653" y="124" fill="#fca5a5" font-size="11" font-weight="700" text-anchor="middle">Risk Scores</text>
  <text x="653" y="137" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">20 flags · Scoring 0-100</text>

  <!-- M3: Competition (right-top) -->
  <line x1="522" y1="218" x2="490" y2="226" stroke="rgba(168,85,247,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="680" y="158" width="150" height="60" rx="12" fill="rgba(88,28,135,0.25)" stroke="rgba(168,85,247,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="755" y="180" fill="white" font-size="16" text-anchor="middle">📈</text>
  <text x="755" y="196" fill="#d8b4fe" font-size="11" font-weight="700" text-anchor="middle">Competencia</text>
  <text x="755" y="209" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">HHI · Sectores · Oferentes</text>

  <!-- M4: Market (right) -->
  <line x1="522" y1="248" x2="490" y2="244" stroke="rgba(34,197,94,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="700" y="224" width="150" height="60" rx="12" fill="rgba(6,78,59,0.25)" stroke="rgba(34,197,94,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="775" y="246" fill="white" font-size="16" text-anchor="middle">🏪</text>
  <text x="775" y="262" fill="#86efac" font-size="11" font-weight="700" text-anchor="middle">Mercado</text>
  <text x="775" y="275" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Entidad · Provincia · Tipo</text>

  <!-- M5: PAC (right-bottom) -->
  <line x1="510" y1="274" x2="487" y2="263" stroke="rgba(250,204,21,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="660" y="310" width="150" height="60" rx="12" fill="rgba(120,53,15,0.25)" stroke="rgba(251,146,60,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="735" y="332" fill="white" font-size="16" text-anchor="middle">📋</text>
  <text x="735" y="348" fill="#fdba74" font-size="11" font-weight="700" text-anchor="middle">PAC vs Ejecutado</text>
  <text x="735" y="361" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Desviación · Ejecución %</text>

  <!-- M6: Alerts (bottom-right) -->
  <line x1="489" y1="307" x2="476" y2="283" stroke="rgba(239,68,68,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="540" y="390" width="150" height="60" rx="12" fill="rgba(127,29,29,0.25)" stroke="rgba(239,68,68,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="615" y="412" fill="white" font-size="16" text-anchor="middle">🔔</text>
  <text x="615" y="428" fill="#fca5a5" font-size="11" font-weight="700" text-anchor="middle">Alertas</text>
  <text x="615" y="441" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">616 activas · CRITICAL/WARN</text>

  <!-- M7: Provider Network (bottom) -->
  <line x1="450" y1="312" x2="450" y2="283" stroke="rgba(168,85,247,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="360" y="390" width="150" height="60" rx="12" fill="rgba(88,28,135,0.25)" stroke="rgba(168,85,247,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="435" y="412" fill="white" font-size="16" text-anchor="middle">🕸️</text>
  <text x="435" y="428" fill="#d8b4fe" font-size="11" font-weight="700" text-anchor="middle">Red Proveedores</text>
  <text x="435" y="441" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">52 nodos · 53 conexiones</text>

  <!-- M8: Provider Scores (bottom-left) -->
  <line x1="411" y1="306" x2="425" y2="282" stroke="rgba(34,197,94,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="200" y="390" width="150" height="60" rx="12" fill="rgba(6,78,59,0.25)" stroke="rgba(34,197,94,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="275" y="412" fill="white" font-size="16" text-anchor="middle">⭐</text>
  <text x="275" y="428" fill="#86efac" font-size="11" font-weight="700" text-anchor="middle">Score Proveedor</text>
  <text x="275" y="441" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">4D · premium/restricted</text>

  <!-- M9: Price Index (left-bottom) -->
  <line x1="390" y1="278" x2="415" y2="266" stroke="rgba(59,130,246,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="52" y="310" width="150" height="60" rx="12" fill="rgba(29,78,216,0.2)" stroke="rgba(59,130,246,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="127" y="332" fill="white" font-size="16" text-anchor="middle">💰</text>
  <text x="127" y="348" fill="#93c5fd" font-size="11" font-weight="700" text-anchor="middle">Índice Precios</text>
  <text x="127" y="361" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">CPC · Cross-entity</text>

  <!-- M10: Contract Health (left) -->
  <line x1="378" y1="247" x2="410" y2="244" stroke="rgba(250,204,21,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="36" y="218" width="150" height="60" rx="12" fill="rgba(120,53,15,0.2)" stroke="rgba(250,204,21,0.4)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="111" y="240" fill="white" font-size="16" text-anchor="middle">📑</text>
  <text x="111" y="256" fill="#fde047" font-size="11" font-weight="700" text-anchor="middle">Salud Contractual</text>
  <text x="111" y="269" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Enmiendas · Salud %</text>

  <!-- M11: Fragmentation (left-top) -->
  <line x1="390" y1="208" x2="415" y2="222" stroke="rgba(251,146,60,0.4)" stroke-width="1.5" marker-end="url(#marr)"/>
  <rect x="52" y="148" width="150" height="60" rx="12" fill="rgba(154,52,18,0.2)" stroke="rgba(251,146,60,0.5)" stroke-width="1.5" filter="url(#mshadow)"/>
  <text x="127" y="170" fill="white" font-size="16" text-anchor="middle">✂️</text>
  <text x="127" y="186" fill="#fb923c" font-size="11" font-weight="700" text-anchor="middle">Fragmentación</text>
  <text x="127" y="199" fill="rgba(148,163,184,0.7)" font-size="9" text-anchor="middle">Clustering · Threshold</text>

  <!-- Legend at bottom -->
  <rect x="290" y="20" width="320" height="30" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
  <text x="450" y="32" fill="rgba(148,163,184,0.7)" font-size="10" text-anchor="middle" font-weight="600">11 MÓDULOS ANALÍTICOS · ENDPOINTS REST · TIEMPO REAL</text>
  <text x="450" y="45" fill="rgba(96,165,250,0.6)" font-size="9" text-anchor="middle">GET /api/v1/analytics/*  ·  229 tests pasando</text>
</svg>`;

// ─── Two new slides HTML ─────────────────────────────────────────────
const stackSlide = `
<!-- ═══════════════════════════════════════
  SLIDE A – TECH STACK & ARCHITECTURE
════════════════════════════════════════ -->
<div class="slide slide-arch" id="slide-arch">
  <div class="arch-header">
    <div class="slide-label" style="color:var(--green-400)">Arquitectura</div>
    <h2 class="slide-title">Stack Tecnológico <span class="accent">Moderno</span></h2>
    <p style="color:var(--gray-400);font-size:13px;margin-top:6px">Tecnología de producción. Sin dependencias propietarias. 100% cloud-native.</p>
  </div>
  <div class="arch-diagram">
    ${archSVG}
  </div>
  <div class="arch-pills">
    <span class="tech-pill pill-blue">React 19</span>
    <span class="tech-pill pill-blue">Vite</span>
    <span class="tech-pill pill-blue">Chakra UI v3</span>
    <span class="tech-pill pill-green">Node.js 24</span>
    <span class="tech-pill pill-green">Fastify v5</span>
    <span class="tech-pill pill-green">TypeScript</span>
    <span class="tech-pill pill-purple">Prisma ORM v6</span>
    <span class="tech-pill pill-purple">PostgreSQL 16</span>
    <span class="tech-pill pill-orange">Redis 7</span>
    <span class="tech-pill pill-orange">MinIO / S3</span>
    <span class="tech-pill pill-gray">Playwright</span>
    <span class="tech-pill pill-gray">229 Tests ✓</span>
  </div>
</div>`;

const moduleSlide = `
<!-- ═══════════════════════════════════════
  SLIDE B – MODULE MAP
════════════════════════════════════════ -->
<div class="slide slide-modulemap" id="slide-modulemap">
  <div class="arch-header">
    <div class="slide-label" style="color:var(--blue-400)">Módulos</div>
    <h2 class="slide-title">11 Módulos <span class="accent">Analíticos</span> Interconectados</h2>
    <p style="color:var(--gray-400);font-size:13px;margin-top:6px">Cada módulo expone endpoints REST independientes y consume datos del mismo motor central.</p>
  </div>
  <div class="arch-diagram" style="flex:1;padding:0 40px 0">
    ${moduleMapSVG}
  </div>
</div>`;

// ─── Extra CSS for new slides ────────────────────────────────────────
const extraCSS = `
  /* Architecture slides */
  .slide-arch, .slide-modulemap {
    background: linear-gradient(180deg, #070d1a 0%, #0f172a 100%);
    padding: 36px 56px 20px;
    display: flex; flex-direction: column;
  }
  .arch-header { margin-bottom: 16px; }
  .arch-diagram {
    flex: 1; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
    background: #070d1a;
    min-height: 0;
  }
  .arch-pills {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding-top: 16px;
  }
  .tech-pill {
    padding: 5px 14px; border-radius: 999px;
    font-size: 12px; font-weight: 600;
    border: 1px solid transparent;
  }
  .pill-blue   { background: rgba(59,130,246,0.12);  color: #93c5fd;  border-color: rgba(59,130,246,0.3); }
  .pill-green  { background: rgba(34,197,94,0.12);   color: #86efac;  border-color: rgba(34,197,94,0.3); }
  .pill-purple { background: rgba(168,85,247,0.12);  color: #d8b4fe;  border-color: rgba(168,85,247,0.3); }
  .pill-orange { background: rgba(251,146,60,0.12);  color: #fdba74;  border-color: rgba(251,146,60,0.3); }
  .pill-gray   { background: rgba(148,163,184,0.1);  color: #cbd5e1;  border-color: rgba(148,163,184,0.2); }
`;

// ─── Inject everything ───────────────────────────────────────────────

// 1. Update TOTAL slides count: 12 → 14
html = html.replace('const TOTAL = 12;', 'const TOTAL = 14;');

// 2. Add CSS before </style>
html = html.replace('</style>', extraCSS + '\n</style>');

// 3. Insert new slides before the closing slide (slide-11)
html = html.replace(
  '<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING',
  stackSlide + '\n\n' + moduleSlide + '\n\n<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING'
);

// 4. Update slide IDs for closing slide (it was slide-11, now slide-13)
html = html.replace('id="slide-11"', 'id="slide-13"');

// 5. Update "navigate back" link in closing slide
html = html.replace('navigate(-11)', 'navigate(-13)');

fs.writeFileSync(FILE, html, 'utf-8');
const size = fs.statSync(FILE).size;
console.log(`✅ Architecture slides injected!`);
console.log(`   File: ${FILE}`);
console.log(`   Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
console.log(`\n   Open: open "${FILE}"`);
