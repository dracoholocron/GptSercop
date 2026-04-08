/**
 * Builds a self-contained HTML presentation by embedding screenshots as base64.
 * Output: /Docs/presentation/sercop-analytics-presentation.html
 */
const fs = require('fs');
const path = require('path');

const SHOTS_DIR = path.join(__dirname, 'screenshots');
const OUT_FILE = path.join(__dirname, 'sercop-analytics-presentation.html');

function toBase64(filename) {
  const filepath = path.join(SHOTS_DIR, filename);
  if (!fs.existsSync(filepath)) return '';
  return `data:image/png;base64,${fs.readFileSync(filepath).toString('base64')}`;
}

const imgs = {
  dashboard:       toBase64('01-dashboard.png'),
  riskScores:      toBase64('02-risk-scores.png'),
  competition:     toBase64('03-competition.png'),
  network:         toBase64('04-provider-network.png'),
  fragmentation:   toBase64('05-fragmentation.png'),
  pac:             toBase64('06-pac.png'),
  alerts:          toBase64('07-alerts.png'),
  providerScores:  toBase64('08-provider-scores.png'),
  priceIndex:      toBase64('09-price-index.png'),
  contractHealth:  toBase64('10-contract-health.png'),
};

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Plataforma Analítica SERCOP – Presentación Ejecutiva</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --blue-900: #0f172a;
    --blue-800: #1e293b;
    --blue-700: #1d4ed8;
    --blue-500: #3b82f6;
    --blue-400: #60a5fa;
    --blue-100: #dbeafe;
    --green-500: #22c55e;
    --green-400: #4ade80;
    --red-500: #ef4444;
    --orange-400: #fb923c;
    --yellow-400: #facc15;
    --white: #ffffff;
    --gray-100: #f1f5f9;
    --gray-200: #e2e8f0;
    --gray-400: #94a3b8;
    --gray-600: #475569;
  }

  html, body {
    height: 100%;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--blue-900);
    color: var(--white);
    overflow: hidden;
  }

  /* ── Slides container ── */
  .deck { width: 100vw; height: 100vh; position: relative; overflow: hidden; }

  .slide {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    opacity: 0; pointer-events: none;
    transition: opacity 0.5s ease, transform 0.5s ease;
    transform: translateX(60px);
  }
  .slide.active {
    opacity: 1; pointer-events: all;
    transform: translateX(0);
  }
  .slide.exit {
    opacity: 0;
    transform: translateX(-60px);
    pointer-events: none;
  }

  /* ── Progress bar ── */
  #progress-bar {
    position: fixed; top: 0; left: 0;
    height: 3px; background: var(--blue-500);
    transition: width 0.4s ease; z-index: 100;
  }

  /* ── Slide counter ── */
  #slide-counter {
    position: fixed; bottom: 24px; right: 32px;
    font-size: 12px; color: var(--gray-400);
    font-variant-numeric: tabular-nums; z-index: 100;
    letter-spacing: 0.05em;
  }

  /* ── Navigation ── */
  .nav-btn {
    position: fixed; top: 50%; transform: translateY(-50%);
    background: rgba(30,41,59,0.85); border: 1px solid rgba(255,255,255,0.1);
    color: white; width: 44px; height: 44px; border-radius: 50%;
    font-size: 18px; cursor: pointer; z-index: 100;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, border-color 0.2s;
    backdrop-filter: blur(8px);
  }
  .nav-btn:hover { background: rgba(59,130,246,0.5); border-color: var(--blue-500); }
  #nav-prev { left: 16px; }
  #nav-next { right: 16px; }

  /* ── Slide dot nav ── */
  #dot-nav {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 8px; z-index: 100;
  }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.25); cursor: pointer;
    transition: background 0.3s, transform 0.3s;
  }
  .dot.active { background: var(--blue-500); transform: scale(1.3); }

  /* ════════════════════════════════════════════
     SLIDE LAYOUTS
  ════════════════════════════════════════════ */

  /* Cover slide */
  .slide-cover {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
    align-items: center; justify-content: center; text-align: center;
    padding: 60px;
    position: relative; overflow: hidden;
  }
  .slide-cover::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.1) 0%, transparent 60%);
  }
  .cover-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4);
    border-radius: 999px; padding: 6px 18px; font-size: 13px;
    color: var(--blue-400); margin-bottom: 32px; position: relative;
  }
  .cover-title {
    font-size: clamp(36px, 5vw, 64px); font-weight: 800;
    line-height: 1.1; position: relative;
    background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cover-subtitle {
    font-size: clamp(18px, 2.5vw, 26px); color: var(--blue-400);
    margin-top: 16px; font-weight: 300; position: relative;
  }
  .cover-tagline {
    font-size: 15px; color: var(--gray-400); margin-top: 12px;
    position: relative; max-width: 600px; line-height: 1.6;
  }
  .cover-stats {
    display: flex; gap: 48px; margin-top: 56px; position: relative;
  }
  .cover-stat { text-align: center; }
  .cover-stat-num {
    font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cover-stat-label { font-size: 12px; color: var(--gray-400); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
  .cover-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* Problem slide */
  .slide-problem {
    background: linear-gradient(180deg, #0f172a 0%, #1c1917 100%);
    padding: 60px 80px;
    justify-content: center;
  }
  .problem-header { margin-bottom: 48px; }
  .slide-label {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;
    color: var(--blue-400); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .slide-label::before {
    content: ''; display: block; width: 24px; height: 2px;
    background: var(--blue-500);
  }
  .slide-title {
    font-size: clamp(28px, 4vw, 48px); font-weight: 700;
    line-height: 1.15;
  }
  .slide-title .accent { color: var(--blue-400); }
  .problem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .problem-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 28px;
    transition: border-color 0.3s;
  }
  .problem-card:hover { border-color: rgba(239,68,68,0.4); }
  .problem-icon { font-size: 32px; margin-bottom: 16px; }
  .problem-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .problem-card p { font-size: 13px; color: var(--gray-400); line-height: 1.6; }
  .problem-bottom {
    margin-top: 32px;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px; padding: 20px 28px;
    display: flex; align-items: center; gap: 16px;
  }
  .problem-bottom-icon { font-size: 24px; }
  .problem-bottom-text { font-size: 15px; color: #fca5a5; line-height: 1.5; }
  .problem-bottom-text strong { color: var(--red-500); }

  /* Screenshot slide */
  .slide-screenshot {
    background: var(--blue-900);
    display: grid; grid-template-columns: 1fr 420px;
    padding: 0;
    overflow: hidden;
  }
  .screenshot-content {
    padding: 60px 56px;
    display: flex; flex-direction: column; justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  .screenshot-panel {
    position: relative; overflow: hidden;
    background: #0d1117;
  }
  .screenshot-panel img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: top left;
    opacity: 0.92;
    transition: transform 8s ease;
  }
  .slide-screenshot:hover .screenshot-panel img {
    transform: translateY(-8%);
  }
  .screenshot-panel::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to right, rgba(15,23,42,0.5) 0%, transparent 40%);
    z-index: 1;
  }
  .screenshot-panel::after {
    content: 'LIVE SYSTEM';
    position: absolute; top: 20px; right: 20px;
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4);
    color: var(--green-400); font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; padding: 4px 10px; border-radius: 999px;
    z-index: 2;
  }
  .ss-slide-num {
    font-size: 11px; color: var(--blue-400); text-transform: uppercase;
    letter-spacing: 0.15em; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .ss-slide-num::before { content: ''; display: block; width: 24px; height: 2px; background: var(--blue-500); }
  .ss-title { font-size: clamp(24px, 3.5vw, 40px); font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
  .ss-desc { font-size: 14px; color: var(--gray-400); line-height: 1.7; margin-bottom: 32px; max-width: 340px; }
  .ss-findings { display: flex; flex-direction: column; gap: 12px; }
  .finding {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 14px 16px;
    transition: border-color 0.3s;
  }
  .finding:hover { border-color: rgba(59,130,246,0.35); }
  .finding-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .finding-text { font-size: 13px; line-height: 1.5; color: var(--gray-200); }
  .finding-text strong { color: white; }
  .badge-pill {
    display: inline-block; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; padding: 3px 8px; border-radius: 999px;
    margin-right: 4px; margin-top: 4px;
  }
  .badge-red    { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
  .badge-orange { background: rgba(251,146,60,0.15); color: #fdba74; border: 1px solid rgba(251,146,60,0.3); }
  .badge-green  { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
  .badge-blue   { background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
  .badge-purple { background: rgba(168,85,247,0.15); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.3); }

  /* Comparison slide */
  .slide-compare {
    background: linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%);
    padding: 60px 80px;
    justify-content: center;
  }
  .compare-table {
    width: 100%; border-collapse: collapse;
    margin-top: 40px; font-size: 14px;
  }
  .compare-table th {
    padding: 14px 20px; text-align: left;
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--gray-400);
  }
  .compare-table th:nth-child(2) {
    color: var(--red-500);
    background: rgba(239,68,68,0.06);
    border-radius: 8px 8px 0 0;
  }
  .compare-table th:nth-child(3) {
    color: var(--green-400);
    background: rgba(34,197,94,0.06);
    border-radius: 8px 8px 0 0;
  }
  .compare-table td {
    padding: 13px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    vertical-align: middle;
  }
  .compare-table td:first-child { color: var(--gray-200); }
  .compare-table td:nth-child(2) { background: rgba(239,68,68,0.04); color: #fca5a5; }
  .compare-table td:nth-child(3) { background: rgba(34,197,94,0.04); color: #86efac; }
  .compare-table tr:last-child td { border-bottom: none; }
  .icon-no  { color: var(--red-500); font-size: 16px; }
  .icon-yes { color: var(--green-500); font-size: 16px; }

  /* Roadmap slide */
  .slide-roadmap {
    background: linear-gradient(135deg, #0f172a 0%, #1a1033 100%);
    padding: 60px 80px;
    justify-content: center;
  }
  .roadmap-phases {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top: 40px;
  }
  .phase {
    border-radius: 20px; padding: 36px 28px;
    position: relative; overflow: hidden;
    transition: transform 0.3s;
  }
  .phase:hover { transform: translateY(-4px); }
  .phase-1 {
    background: linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%);
    border: 1px solid rgba(34,197,94,0.25);
  }
  .phase-2 {
    background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%);
    border: 1px solid rgba(59,130,246,0.25);
  }
  .phase-3 {
    background: linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.04) 100%);
    border: 1px solid rgba(168,85,247,0.25);
  }
  .phase-num {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;
    font-weight: 700; margin-bottom: 12px;
  }
  .phase-1 .phase-num { color: var(--green-400); }
  .phase-2 .phase-num { color: var(--blue-400); }
  .phase-3 .phase-num { color: #d8b4fe; }
  .phase h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .phase-duration {
    font-size: 12px; color: var(--gray-400); margin-bottom: 20px;
    display: flex; align-items: center; gap: 6px;
  }
  .phase ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .phase ul li {
    font-size: 13px; color: var(--gray-200); display: flex; gap: 10px;
    align-items: flex-start; line-height: 1.5;
  }
  .phase ul li::before { content: '→'; color: var(--gray-400); flex-shrink: 0; margin-top: 1px; }
  .phase-status {
    position: absolute; top: 20px; right: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    padding: 4px 10px; border-radius: 999px;
  }
  .status-live    { background: rgba(34,197,94,0.15);  color: var(--green-400); border: 1px solid rgba(34,197,94,0.4); }
  .status-next    { background: rgba(59,130,246,0.15); color: var(--blue-400);  border: 1px solid rgba(59,130,246,0.4); }
  .status-future  { background: rgba(168,85,247,0.15); color: #d8b4fe;          border: 1px solid rgba(168,85,247,0.4); }

  /* Closing slide */
  .slide-closing {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
    align-items: center; justify-content: center; text-align: center;
    padding: 60px; position: relative; overflow: hidden;
  }
  .closing-ring {
    position: absolute;
    border-radius: 50%; border: 1px solid rgba(59,130,246,0.15);
  }
  .ring-1 { width: 400px; height: 400px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .ring-2 { width: 600px; height: 600px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .ring-3 { width: 800px; height: 800px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .closing-icon { font-size: 64px; margin-bottom: 24px; position: relative; }
  .closing-title {
    font-size: clamp(32px, 5vw, 56px); font-weight: 800; position: relative;
    background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; line-height: 1.1;
  }
  .closing-subtitle { font-size: 18px; color: var(--blue-400); margin-top: 16px; position: relative; }
  .closing-actions { display: flex; gap: 16px; margin-top: 48px; position: relative; justify-content: center; }
  .btn-primary {
    background: var(--blue-700); color: white;
    padding: 14px 32px; border-radius: 12px;
    font-size: 15px; font-weight: 600; text-decoration: none;
    border: 1px solid rgba(255,255,255,0.1);
    transition: background 0.2s;
  }
  .btn-primary:hover { background: var(--blue-500); }
  .btn-secondary {
    background: rgba(255,255,255,0.06); color: white;
    padding: 14px 32px; border-radius: 12px;
    font-size: 15px; font-weight: 600; text-decoration: none;
    border: 1px solid rgba(255,255,255,0.12);
    transition: background 0.2s;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); }

  /* Keyboard hint */
  #keyboard-hint {
    position: fixed; bottom: 56px; right: 32px;
    font-size: 11px; color: rgba(255,255,255,0.2);
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>
<div id="progress-bar"></div>

<button class="nav-btn" id="nav-prev" onclick="navigate(-1)">‹</button>
<button class="nav-btn" id="nav-next" onclick="navigate(1)">›</button>

<div id="dot-nav"></div>
<div id="slide-counter"></div>
<div id="keyboard-hint">← → SPACE · ESC para salir</div>

<div class="deck" id="deck">

<!-- ═══════════════════════════════════════
  SLIDE 1 – COVER
════════════════════════════════════════ -->
<div class="slide slide-cover active" id="slide-0">
  <div class="cover-glow"></div>
  <div class="cover-badge">🇪🇨 &nbsp; República del Ecuador · SERCOP</div>
  <h1 class="cover-title">Plataforma de<br>Analítica Avanzada</h1>
  <p class="cover-subtitle">Sistema Nacional de Contratación Pública</p>
  <p class="cover-tagline">Detección automática de fraude, corrupción y malas prácticas<br>en la contratación pública ecuatoriana en tiempo real.</p>
  <div class="cover-stats">
    <div class="cover-stat">
      <div class="cover-stat-num">20</div>
      <div class="cover-stat-label">Patrones de riesgo</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">616</div>
      <div class="cover-stat-label">Alertas generadas</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">11</div>
      <div class="cover-stat-label">Módulos analíticos</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">0s</div>
      <div class="cover-stat-label">Intervención manual</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 2 – THE PROBLEM
════════════════════════════════════════ -->
<div class="slide slide-problem" id="slide-1">
  <div class="problem-header">
    <div class="slide-label">Contexto</div>
    <h2 class="slide-title">El sistema actual <span class="accent">no detecta fraude</span></h2>
  </div>
  <div class="problem-grid">
    <div class="problem-card">
      <div class="problem-icon">🔍</div>
      <h3>Sin detección automática</h3>
      <p>El SOCE actual procesa miles de millones en contratos anuales sin ningún motor de detección de irregularidades. Todo es revisión manual.</p>
    </div>
    <div class="problem-card">
      <div class="problem-icon">🔗</div>
      <h3>Sin análisis de redes</h3>
      <p>Las relaciones entre proveedores —indicadores clave de colusión— son invisibles para el sistema. No existe análisis de grafos ni detección de patrones.</p>
    </div>
    <div class="problem-card">
      <div class="problem-icon">💰</div>
      <h3>Sin validación de precios</h3>
      <p>Contratos adjudicados al 150% del promedio sectorial pasan sin alerta. No existe índice nacional de precios de referencia.</p>
    </div>
    <div class="problem-card">
      <div class="problem-icon">📋</div>
      <h3>Fragmentación indetectable</h3>
      <p>La división artificial de contratos para evadir umbrales de licitación es la práctica más frecuente y completamente invisible al SOCE.</p>
    </div>
    <div class="problem-card">
      <div class="problem-icon">⏰</div>
      <h3>Solo auditoría post-hecho</h3>
      <p>Los problemas se detectan meses o años después de que el dinero ya fue pagado. No existe alerta temprana ni monitoreo en tiempo real.</p>
    </div>
    <div class="problem-card">
      <div class="problem-icon">📉</div>
      <h3>Sin reputación de proveedores</h3>
      <p>Un proveedor con historial de incumplimientos puede ganar nuevos contratos sin restricciones. No existe sistema de puntuación o tiers.</p>
    </div>
  </div>
  <div class="problem-bottom">
    <div class="problem-bottom-icon">⚠️</div>
    <div class="problem-bottom-text">
      <strong>Resultado:</strong> Millones de dólares en contratos con irregularidades detectables son adjudicados cada año sin que ningún sistema emita una sola alerta automática.
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 3 – DASHBOARD
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-2">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 1 / 11</div>
    <h2 class="ss-title">Dashboard Analítico<br><span style="color:var(--blue-400)">Nacional</span></h2>
    <p class="ss-desc">Vista ejecutiva en tiempo real del estado de la contratación pública. KPIs automáticos sin intervención manual.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">📊</div>
        <div class="finding-text"><strong>580 procesos</strong> analizados automáticamente al iniciar sesión</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🔴</div>
        <div class="finding-text"><strong>15 procesos de alto riesgo</strong> identificados. El SOCE actual: 0 alertas.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🔔</div>
        <div class="finding-text"><strong>616 alertas activas</strong> listas para que auditores tomen acción inmediata</div>
      </div>
      <div class="finding">
        <div class="finding-icon">⚡</div>
        <div class="finding-text">Tiempo de detección: <strong>bajo demanda</strong>. Sin esperar reportes manuales.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.dashboard}" alt="Analytics Dashboard" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 4 – RISK SCORES
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-3">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 2 / 11</div>
    <h2 class="ss-title">Motor de<br><span style="color:var(--red-500)">Detección de Riesgo</span></h2>
    <p class="ss-desc">20 patrones de riesgo calculados automáticamente para cada proceso de contratación.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">🎯</div>
        <div class="finding-text">
          <strong>Flags detectados en datos reales:</strong><br>
          <span class="badge-pill badge-red">SINGLE_BIDDER</span>
          <span class="badge-pill badge-orange">OVERPRICE</span>
          <span class="badge-pill badge-red">FAST_PROCESS</span>
          <span class="badge-pill badge-purple">FRAGMENTATION</span>
          <span class="badge-pill badge-orange">WINNER_ROTATION</span>
        </div>
      </div>
      <div class="finding">
        <div class="finding-icon">🏢</div>
        <div class="finding-text"><strong>NEW_COMPANY_LARGE_CONTRACT:</strong> Empresa de 60 días con contrato de $340,000. Detectado automáticamente.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🔄</div>
        <div class="finding-text"><strong>ALWAYS_LOSES:</strong> Proveedor con 8 participaciones y 0 victorias — licitación ficticia.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.riskScores}" alt="Risk Scores" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 5 – PROVIDER NETWORK
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-4">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 7 / 11</div>
    <h2 class="ss-title">Red de<br><span style="color:var(--blue-400)">Proveedores</span></h2>
    <p class="ss-desc">Análisis de grafos para detectar colusión mediante patrones de participación conjunta en procesos.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">🔗</div>
        <div class="finding-text"><strong>52 nodos, 53 conexiones</strong> detectadas en la red de proveedores del Estado.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">👥</div>
        <div class="finding-text"><strong>Par colusivo:</strong> ProveedorA + ProveedorB aparecen juntos en 5 licitaciones consecutivas.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🔺</div>
        <div class="finding-text"><strong>Triángulo colusivo:</strong> 3 proveedores en 4 procesos (SERCOP-AN-030..033). Patrón de rotación confirmado.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">❓</div>
        <div class="finding-text">Capacidad no disponible en ningún sistema de contratación pública de Ecuador.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.network}" alt="Provider Network" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 6 – FRAGMENTATION
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-5">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 11 / 11</div>
    <h2 class="ss-title">Detector de<br><span style="color:var(--orange-400)">Fragmentación</span></h2>
    <p class="ss-desc">Identifica la división artificial de contratos para evadir umbrales de licitación competitiva — práctica más común de corrupción.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">✂️</div>
        <div class="finding-text"><strong>53 patrones de fragmentación</strong> detectados automáticamente en el dataset.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">📅</div>
        <div class="finding-text"><strong>Ejemplo real:</strong> 4 contratos de montos similares en la misma entidad, emitidos en 7 días (SERCOP-AN-010..013)</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🚨</div>
        <div class="finding-text">Alertas CRITICAL cuando 5+ contratos en 30 días. Notificación directa a auditores.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.fragmentation}" alt="Fragmentation Detection" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 7 – PAC ANALYSIS
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-6">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 5 / 11</div>
    <h2 class="ss-title">PAC vs<br><span style="color:var(--yellow-400)">Ejecutado</span></h2>
    <p class="ss-desc">Compara la planificación anual de compras con la ejecución real por entidad. Detecta desperdicio presupuestario y mala planificación.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">📋</div>
        <div class="finding-text"><strong>Entidades con &lt;40% de ejecución</strong> automáticamente resaltadas para intervención.</div>
      </div>
      <div class="finding">
        <div class="finding-icon">📉</div>
        <div class="finding-text"><strong>Caso real detectado:</strong> Entidad planificó 5 procesos, ejecutó solo 1 (20% de ejecución).</div>
      </div>
      <div class="finding">
        <div class="finding-icon">💰</div>
        <div class="finding-text">Permite identificar <strong>subejercicio presupuestario</strong> antes de que termine el año fiscal.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.pac}" alt="PAC Analysis" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 8 – ALERTS
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-7">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 6 / 11</div>
    <h2 class="ss-title">Sistema de<br><span style="color:var(--red-500)">Alertas Tempranas</span></h2>
    <p class="ss-desc">Centro de comando para auditores. Priorización automática por severidad con trazabilidad completa.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">🔔</div>
        <div class="finding-text"><strong>616 alertas activas</strong> clasificadas en: <span class="badge-pill badge-red">CRITICAL</span> <span class="badge-pill badge-orange">WARNING</span> <span class="badge-pill badge-blue">INFO</span></div>
      </div>
      <div class="finding">
        <div class="finding-icon">🏆</div>
        <div class="finding-text">Top alertas: <strong>REGIONAL_CONCENTRATION</strong> (97), <strong>WINNER_ROTATION</strong> (86), <strong>FEW_BIDS</strong> (85)</div>
      </div>
      <div class="finding">
        <div class="finding-icon">✅</div>
        <div class="finding-text">Auditores pueden <strong>resolver alertas</strong> con un clic, dejando trazabilidad completa de la decisión.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.alerts}" alt="Alerts Management" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 9 – PROVIDER SCORES
════════════════════════════════════════ -->
<div class="slide slide-screenshot" id="slide-8">
  <div class="screenshot-content">
    <div class="ss-slide-num">Módulo 8 / 11</div>
    <h2 class="ss-title">Buró de Crédito<br><span style="color:var(--green-400)">del Estado</span></h2>
    <p class="ss-desc">Score de reputación para cada proveedor del Estado. Evalúa cumplimiento, entrega a tiempo, precios competitivos y diversificación.</p>
    <div class="ss-findings">
      <div class="finding">
        <div class="finding-icon">⭐</div>
        <div class="finding-text">
          Clasificación en tiers: <span class="badge-pill badge-green">PREMIUM</span> <span class="badge-pill badge-blue">STANDARD</span> <span class="badge-pill badge-orange">WATCH</span> <span class="badge-pill badge-red">RESTRICTED</span>
        </div>
      </div>
      <div class="finding">
        <div class="finding-icon">📊</div>
        <div class="finding-text">4 dimensiones: <strong>Cumplimiento</strong> (30%), <strong>Puntualidad</strong> (25%), <strong>Precio</strong> (25%), <strong>Diversidad</strong> (20%)</div>
      </div>
      <div class="finding">
        <div class="finding-icon">🚫</div>
        <div class="finding-text">Proveedores en tier <strong>RESTRICTED</strong> pueden ser bloqueados automáticamente de nuevas licitaciones.</div>
      </div>
    </div>
  </div>
  <div class="screenshot-panel">
    <img src="${imgs.providerScores}" alt="Provider Scores" loading="lazy">
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 10 – COMPARISON TABLE
════════════════════════════════════════ -->
<div class="slide slide-compare" id="slide-9">
  <div class="slide-label">Propuesta de valor</div>
  <h2 class="slide-title">SOCE Actual vs <span class="accent">Nueva Plataforma</span></h2>
  <table class="compare-table">
    <thead>
      <tr>
        <th>Capacidad</th>
        <th>❌ SOCE Actual</th>
        <th>✅ Nueva Plataforma</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Detección de riesgo</td>
        <td>Manual, post-adjudicación</td>
        <td>Automática, tiempo real, 20 patrones</td>
      </tr>
      <tr>
        <td>Validación de precios</td>
        <td>Sin validación</td>
        <td>Índice nacional de precios por CPC</td>
      </tr>
      <tr>
        <td>Detección de colusión</td>
        <td>Inexistente</td>
        <td>Análisis de grafos (52 nodos, 53 aristas)</td>
      </tr>
      <tr>
        <td>Fragmentación contractual</td>
        <td>Invisible al sistema</td>
        <td>Detección automática de clusters</td>
      </tr>
      <tr>
        <td>Reputación de proveedores</td>
        <td>Solo registro RUP</td>
        <td>Score 4D + tiers premium/restricted</td>
      </tr>
      <tr>
        <td>Análisis PAC vs ejecutado</td>
        <td>Reportes manuales</td>
        <td>Dashboard en tiempo real por entidad</td>
      </tr>
      <tr>
        <td>Alertas para auditores</td>
        <td>Cero alertas automáticas</td>
        <td>616 alertas priorizadas y gestionables</td>
      </tr>
      <tr>
        <td>Riesgo predictivo</td>
        <td>No existe</td>
        <td>Score predictivo pre-adjudicación</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 11 – ROADMAP
════════════════════════════════════════ -->
<div class="slide slide-roadmap" id="slide-10">
  <div class="slide-label">Implementación sin disrupción</div>
  <h2 class="slide-title">Plan de <span class="accent">Migración</span> en 3 Fases</h2>
  <div class="roadmap-phases">
    <div class="phase phase-1">
      <div class="phase-status status-live">✓ EN VIVO</div>
      <div class="phase-num">Fase 1</div>
      <h3>Analítica sobre datos existentes</h3>
      <div class="phase-duration">⏱ Disponible ahora</div>
      <ul>
        <li>Motor de riesgo (20 patrones)</li>
        <li>Sistema de alertas tempranas</li>
        <li>Red de proveedores (grafos)</li>
        <li>Dashboard ejecutivo nacional</li>
        <li>Score de reputación proveedores</li>
        <li>Detección de fragmentación</li>
      </ul>
    </div>
    <div class="phase phase-2">
      <div class="phase-status status-next">PRÓXIMA</div>
      <div class="phase-num">Fase 2</div>
      <h3>Integración con datos en vivo</h3>
      <div class="phase-duration">⏱ 3 meses</div>
      <ul>
        <li>Conexión a feed SERCOP en tiempo real</li>
        <li>Estándar OCDS (Open Contracting)</li>
        <li>Integración SRI para vínculos societarios</li>
        <li>Integración Contraloría</li>
        <li>Módulo de inteligencia artificial</li>
      </ul>
    </div>
    <div class="phase phase-3">
      <div class="phase-status status-future">FUTURO</div>
      <div class="phase-num">Fase 3</div>
      <h3>Reemplazo de capa analítica</h3>
      <div class="phase-duration">⏱ 6 meses</div>
      <ul>
        <li>Reemplazo completo de reportes SOCE</li>
        <li>Portal ciudadano de transparencia</li>
        <li>API pública de datos abiertos</li>
        <li>Modelos ML para predicción de riesgo</li>
        <li>Interoperabilidad con sistemas externos</li>
      </ul>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  SLIDE 12 – CLOSING
════════════════════════════════════════ -->
<div class="slide slide-closing" id="slide-11">
  <div class="closing-ring ring-3"></div>
  <div class="closing-ring ring-2"></div>
  <div class="closing-ring ring-1"></div>
  <div class="closing-icon">🏛️</div>
  <h2 class="closing-title">El sistema ya existe.<br>Los datos hablan solos.</h2>
  <p class="closing-subtitle">580 contratos. 616 alertas. 0 intervenciones manuales.</p>
  <p style="color:var(--gray-400);font-size:14px;margin-top:16px;position:relative;max-width:500px;line-height:1.7">
    La diferencia entre el SOCE actual y esta plataforma no es tecnológica — es la diferencia entre <em>buscar fraude después de que ocurre</em> y <em>prevenirlo antes de que el dinero salga.</em>
  </p>
  <div class="closing-actions">
    <a href="#" class="btn-primary" onclick="navigate(-11)">← Ver desde el inicio</a>
    <a href="http://localhost:5177/analytics" target="_blank" class="btn-secondary">🚀 Demo en vivo</a>
  </div>
</div>

</div><!-- /deck -->

<script>
const TOTAL = 12;
let current = 0;
let animating = false;

function buildDots() {
  const nav = document.getElementById('dot-nav');
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goTo(i);
    nav.appendChild(d);
  }
}

function updateUI() {
  document.getElementById('progress-bar').style.width = ((current + 1) / TOTAL * 100) + '%';
  document.getElementById('slide-counter').textContent = (current + 1) + ' / ' + TOTAL;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  document.getElementById('nav-prev').style.opacity = current === 0 ? '0.3' : '1';
  document.getElementById('nav-next').style.opacity = current === TOTAL - 1 ? '0.3' : '1';
}

function goTo(next) {
  if (animating || next === current || next < 0 || next >= TOTAL) return;
  animating = true;
  const slides = document.querySelectorAll('.slide');
  slides[current].classList.add('exit');
  slides[current].classList.remove('active');
  setTimeout(() => {
    slides[current].classList.remove('exit');
    current = next;
    slides[current].classList.add('active');
    updateUI();
    setTimeout(() => { animating = false; }, 500);
  }, 200);
}

function navigate(dir) { goTo(current + dir); }

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); navigate(1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
  if (e.key === 'Escape') { /* could close fullscreen */ }
});

// Touch/swipe
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
});

buildDots();
updateUI();
</script>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, 'utf-8');
const size = fs.statSync(OUT_FILE).size;
console.log(`✅ Presentation built: ${OUT_FILE}`);
console.log(`   Size: ${(size / 1024 / 1024).toFixed(1)} MB (self-contained)`);
console.log(`\n   Open with: open "${OUT_FILE}"`);
