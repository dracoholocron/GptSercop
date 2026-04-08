/**
 * Builds v2 of the SERCOP Analytics Presentation.
 * Takes the existing v1 HTML and injects 6 new slides covering:
 *   - Drill-Down Navigation
 *   - Geographic Analytics
 *   - Process Efficiency
 *   - Savings Analysis
 *   - MIPYME Participation
 *   - Emergency Contracts
 *
 * Output: /Docs/presentation/sercop-analytics-presentation-v2.html
 */
const fs = require('fs');
const path = require('path');

const V1_FILE = path.join(__dirname, 'sercop-analytics-presentation.html');
const OUT_FILE = path.join(__dirname, 'sercop-analytics-presentation-v2.html');

const NEW_SLIDES_COUNT = 5; // 5 new slides (closing already counted in v1)
const V1_TOTAL = 15;
const V2_TOTAL = V1_TOTAL + NEW_SLIDES_COUNT; // = 20

// ── New CSS for v2 slides ──────────────────────────────────────────────────
const V2_CSS = `
  /* ════════════════════════════════
     V2 NEW SLIDE STYLES
  ════════════════════════════════ */

  /* v2 badge shown in corner */
  .v2-badge {
    position: fixed; top: 16px; right: 80px; z-index: 200;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: white; font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 4px 12px; border-radius: 999px;
  }

  /* Drill-down slide */
  .slide-drilldown {
    background: linear-gradient(135deg, #0f172a 0%, #1a1040 50%, #0f172a 100%);
    padding: 48px 72px; justify-content: center;
  }

  /* Module grid slide */
  .slide-modules-v2 {
    background: linear-gradient(180deg, #0f172a 0%, #0a1628 100%);
    padding: 48px 64px; justify-content: center;
  }

  .modules-v2-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 32px;
  }

  .module-v2-card {
    background: rgba(30,41,59,0.8);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 20px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color 0.2s;
    position: relative;
    overflow: hidden;
  }
  .module-v2-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--card-accent, var(--blue-500));
  }
  .module-v2-icon { font-size: 26px; }
  .module-v2-name {
    font-size: 14px; font-weight: 700; color: white;
  }
  .module-v2-desc {
    font-size: 12px; color: var(--gray-400); line-height: 1.5;
  }
  .module-v2-tag {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; padding: 3px 8px; border-radius: 4px;
    display: inline-block; width: fit-content;
  }
  .tag-new { background: rgba(34,197,94,0.15); color: #4ade80; }
  .tag-existing { background: rgba(59,130,246,0.15); color: #60a5fa; }

  /* Drill-down flow diagram */
  .dd-flow {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 32px 0;
    justify-content: center;
    flex-wrap: wrap;
  }
  .dd-node {
    background: rgba(30,41,59,0.9);
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 12px;
    padding: 16px 20px;
    min-width: 140px;
    text-align: center;
    position: relative;
  }
  .dd-node-icon { font-size: 28px; margin-bottom: 6px; }
  .dd-node-title { font-size: 12px; font-weight: 700; color: white; }
  .dd-node-sub { font-size: 11px; color: var(--gray-400); margin-top: 3px; }
  .dd-arrow {
    color: var(--blue-400);
    font-size: 22px;
    padding: 0 8px;
    flex-shrink: 0;
  }
  .dd-feature-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
  }
  .dd-feature {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(30,41,59,0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px;
  }
  .dd-feature-icon { font-size: 20px; flex-shrink: 0; }
  .dd-feature-title { font-size: 13px; font-weight: 600; color: white; }
  .dd-feature-desc { font-size: 11px; color: var(--gray-400); margin-top: 3px; line-height: 1.4; }

  /* Analytics module slides */
  .slide-analytics-module {
    padding: 48px 72px; justify-content: center;
  }
  .analytics-module-header { margin-bottom: 28px; }
  .analytics-kpis {
    display: flex; gap: 16px; margin-bottom: 24px;
  }
  .analytics-kpi {
    flex: 1;
    background: rgba(30,41,59,0.8);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px 20px;
    text-align: center;
  }
  .analytics-kpi-num {
    font-size: 28px; font-weight: 800;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .analytics-kpi-label {
    font-size: 11px; color: var(--gray-400); margin-top: 4px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .analytics-content-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
  }
  .analytics-table-mock {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    overflow: hidden;
  }
  .analytics-table-mock table {
    width: 100%; border-collapse: collapse;
    font-size: 12px;
  }
  .analytics-table-mock th {
    background: rgba(30,41,59,0.8);
    padding: 10px 14px;
    text-align: left; color: var(--gray-400);
    font-weight: 600; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.06em;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .analytics-table-mock td {
    padding: 9px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: white;
  }
  .analytics-table-mock tr:last-child td { border-bottom: none; }
  .analytics-table-mock tr:hover td { background: rgba(59,130,246,0.05); }
  .progress-bar-wrap {
    display: flex; align-items: center; gap: 8px;
  }
  .progress-bar-bg {
    flex: 1; height: 6px; background: rgba(255,255,255,0.1);
    border-radius: 3px; overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%; border-radius: 3px;
  }
  .progress-val { font-size: 11px; color: var(--gray-400); width: 36px; text-align: right; }
  .analytics-insights {
    display: flex; flex-direction: column; gap: 12px;
  }
  .analytics-insight {
    background: rgba(30,41,59,0.7);
    border: 1px solid rgba(255,255,255,0.07);
    border-left: 3px solid var(--insight-color, var(--blue-500));
    border-radius: 0 10px 10px 0;
    padding: 12px 16px;
  }
  .analytics-insight-title { font-size: 13px; font-weight: 600; color: white; }
  .analytics-insight-text { font-size: 11px; color: var(--gray-400); margin-top: 4px; line-height: 1.5; }

  /* Emergency slide */
  .slide-emergency {
    background: linear-gradient(135deg, #0f172a 0%, #1c0a0a 50%, #0f172a 100%);
  }

  /* V2 cover override */
  .cover-v2-label {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2));
    border: 1px solid rgba(124,58,237,0.4);
    border-radius: 999px; padding: 6px 18px; font-size: 13px;
    color: #c4b5fd; margin-bottom: 32px; position: relative;
  }

  /* New modules count badge */
  .new-modules-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);
    border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #4ade80;
    font-weight: 600;
  }
`;

// ── New HTML Slides ────────────────────────────────────────────────────────
const NEW_SLIDES_HTML = `
<!-- ═══════════════════════════════════════
  NEW SLIDE A – V2 COVER / WHAT'S NEW
════════════════════════════════════════ -->
<div class="slide slide-cover" id="slide-new-cover">
  <div class="cover-glow"></div>
  <div class="cover-v2-label">✨ Versión 2.0 — Nuevas Capacidades</div>
  <h1 class="cover-title" style="font-size:clamp(30px,4vw,54px)">Navegación Drill-Down<br><span style="color:#a78bfa">+ 5 Módulos Analíticos</span></h1>
  <p class="cover-subtitle" style="font-size:clamp(14px,1.8vw,20px)">De la vista macro al detalle de cada entidad y proveedor</p>
  <p class="cover-tagline">La v2 agrega navegación interactiva de profundidad, análisis geográfico, eficiencia de procesos, ahorros del Estado, participación MIPYME y monitoreo de emergencias.</p>
  <div class="cover-stats" style="gap:32px;margin-top:40px">
    <div class="cover-stat">
      <div class="cover-stat-num">16</div>
      <div class="cover-stat-label">Módulos activos</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">+5</div>
      <div class="cover-stat-label">Nuevas páginas</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">∞</div>
      <div class="cover-stat-label">Niveles drill-down</div>
    </div>
    <div class="cover-stat">
      <div class="cover-stat-num">100%</div>
      <div class="cover-stat-label">Cobertura analítica</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  NEW SLIDE B – DRILL-DOWN NAVIGATION
════════════════════════════════════════ -->
<div class="slide slide-drilldown" id="slide-new-drilldown">
  <div class="problem-header">
    <div class="slide-label">Nueva funcionalidad</div>
    <h2 class="slide-title">Navegación <span class="accent">Drill-Down</span> Interactiva</h2>
    <p style="color:var(--gray-400);font-size:15px;margin-top:8px;max-width:680px">Click en cualquier KPI, tabla o alerta para ver el detalle completo de entidad o proveedor — sin cambiar de contexto.</p>
  </div>

  <div class="dd-flow">
    <div class="dd-node">
      <div class="dd-node-icon">📊</div>
      <div class="dd-node-title">Dashboard</div>
      <div class="dd-node-sub">Vista global</div>
    </div>
    <div class="dd-arrow">→</div>
    <div class="dd-node" style="border-color:rgba(167,139,250,0.5)">
      <div class="dd-node-icon">⚡</div>
      <div class="dd-node-title">Módulo Analítico</div>
      <div class="dd-node-sub">Riesgo, Alertas, PAC…</div>
    </div>
    <div class="dd-arrow">→</div>
    <div class="dd-node" style="border-color:rgba(251,146,60,0.5)">
      <div class="dd-node-icon">🏛️</div>
      <div class="dd-node-title">Detalle Entidad</div>
      <div class="dd-node-sub">KPIs + histórico</div>
    </div>
    <div class="dd-arrow">→</div>
    <div class="dd-node" style="border-color:rgba(74,222,128,0.5)">
      <div class="dd-node-icon">🏢</div>
      <div class="dd-node-title">Detalle Proveedor</div>
      <div class="dd-node-sub">Score + contratos</div>
    </div>
  </div>

  <div class="dd-feature-list">
    <div class="dd-feature">
      <div class="dd-feature-icon">🎯</div>
      <div>
        <div class="dd-feature-title">Página de Detalle por Entidad</div>
        <div class="dd-feature-desc">KPIs de riesgo, PAC ejecutado, alertas activas, proveedores frecuentes y red de contratación — todo en un solo scroll.</div>
      </div>
    </div>
    <div class="dd-feature">
      <div class="dd-feature-icon">🔍</div>
      <div>
        <div class="dd-feature-title">Página de Detalle por Proveedor</div>
        <div class="dd-feature-desc">Score de reputación, historial de contratos, índice de precios comparado, red de relaciones y alertas asociadas.</div>
      </div>
    </div>
    <div class="dd-feature">
      <div class="dd-feature-icon">📋</div>
      <div>
        <div class="dd-feature-title">Resolución de Alertas con Notas</div>
        <div class="dd-feature-desc">Modal de resolución con campo de notas y acción tomada — queda registrado en metadatos del evento para auditoría.</div>
      </div>
    </div>
    <div class="dd-feature">
      <div class="dd-feature-icon">🔗</div>
      <div>
        <div class="dd-feature-title">Navegación Bidireccional</div>
        <div class="dd-feature-desc">Desde cualquier tabla, click → detalle; y desde el detalle, links a licitaciones, alertas y contratos relacionados.</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  NEW SLIDE C – 16 MÓDULOS V2
════════════════════════════════════════ -->
<div class="slide slide-modules-v2" id="slide-new-modules">
  <div class="problem-header">
    <div class="slide-label">Cobertura completa</div>
    <h2 class="slide-title">16 Módulos <span class="accent">Analíticos</span> — v2</h2>
    <p style="color:var(--gray-400);font-size:14px;margin-top:6px">
      11 módulos originales + 5 nuevos módulos de cobertura de brechas
      <span class="new-modules-badge" style="margin-left:12px">✨ +5 Nuevos</span>
    </p>
  </div>
  <div class="modules-v2-grid">
    <div class="module-v2-card" style="--card-accent:#3b82f6">
      <div class="module-v2-icon">📊</div>
      <div class="module-v2-name">Dashboard Nacional</div>
      <div class="module-v2-desc">Vista ejecutiva consolidada con KPIs nacionales</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#ef4444">
      <div class="module-v2-icon">🎯</div>
      <div class="module-v2-name">Motor de Riesgo</div>
      <div class="module-v2-desc">25 indicadores de riesgo, score 0-100</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#f59e0b">
      <div class="module-v2-icon">🔔</div>
      <div class="module-v2-name">Alertas Tempranas</div>
      <div class="module-v2-desc">Detección automática + resolución con notas</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#8b5cf6">
      <div class="module-v2-icon">🕸️</div>
      <div class="module-v2-name">Red de Proveedores</div>
      <div class="module-v2-desc">Grafo de relaciones y colusión</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#06b6d4">
      <div class="module-v2-icon">💹</div>
      <div class="module-v2-name">Índice de Precios</div>
      <div class="module-v2-desc">Comparación mercado vs contrato adjudicado</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#f97316">
      <div class="module-v2-icon">⚡</div>
      <div class="module-v2-name">Fragmentación</div>
      <div class="module-v2-desc">Detección de fraccionamiento de contratos</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#10b981">
      <div class="module-v2-icon">📅</div>
      <div class="module-v2-name">PAC vs Ejecutado</div>
      <div class="module-v2-desc">Seguimiento del plan anual de contrataciones</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#6366f1">
      <div class="module-v2-icon">⭐</div>
      <div class="module-v2-name">Reputación Proveedor</div>
      <div class="module-v2-desc">Buró de crédito del Estado</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#0ea5e9">
      <div class="module-v2-icon">🏥</div>
      <div class="module-v2-name">Salud de Contratos</div>
      <div class="module-v2-desc">Monitoreo de enmiendas y sobrecostos</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
    <!-- NEW 5 -->
    <div class="module-v2-card" style="--card-accent:#22c55e">
      <div class="module-v2-icon">🗺️</div>
      <div class="module-v2-name">Análisis Geográfico</div>
      <div class="module-v2-desc">Distribución del gasto por provincia</div>
      <span class="module-v2-tag tag-new">✨ Nuevo</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#a855f7">
      <div class="module-v2-icon">⏱️</div>
      <div class="module-v2-name">Eficiencia de Procesos</div>
      <div class="module-v2-desc">Tiempos publicación → oferta → adjudicación</div>
      <span class="module-v2-tag tag-new">✨ Nuevo</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#f43f5e">
      <div class="module-v2-icon">💰</div>
      <div class="module-v2-name">Análisis de Ahorros</div>
      <div class="module-v2-desc">Estimado vs adjudicado por tipo de proceso</div>
      <span class="module-v2-tag tag-new">✨ Nuevo</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#fb923c">
      <div class="module-v2-icon">🏭</div>
      <div class="module-v2-name">Participación MIPYME</div>
      <div class="module-v2-desc">Micro, pequeña y mediana empresa en contratos</div>
      <span class="module-v2-tag tag-new">✨ Nuevo</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#dc2626">
      <div class="module-v2-icon">🚨</div>
      <div class="module-v2-name">Contratos de Emergencia</div>
      <div class="module-v2-desc">Monitoreo de compras por declaratoria de emergencia</div>
      <span class="module-v2-tag tag-new">✨ Nuevo</span>
    </div>
    <div class="module-v2-card" style="--card-accent:#64748b">
      <div class="module-v2-icon">🔎</div>
      <div class="module-v2-name">Competencia Real</div>
      <div class="module-v2-desc">Análisis de proponentes y mercado</div>
      <span class="module-v2-tag tag-existing">Existente</span>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  NEW SLIDE D – GEO + EFFICIENCY + SAVINGS
════════════════════════════════════════ -->
<div class="slide slide-analytics-module" id="slide-new-geo"
     style="background: linear-gradient(180deg, #0f172a 0%, #0a1f0a 100%)">
  <div class="analytics-module-header">
    <div class="slide-label">Nuevos módulos · Geografía & Eficiencia</div>
    <h2 class="slide-title">📍 Análisis Territorial <span class="accent">+ ⏱️ Eficiencia</span></h2>
  </div>
  <div class="analytics-kpis">
    <div class="analytics-kpi">
      <div class="analytics-kpi-num">24</div>
      <div class="analytics-kpi-label">Provincias con datos</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num">68%</div>
      <div class="analytics-kpi-label">Gasto concentrado en 3 provincias</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num">47 días</div>
      <div class="analytics-kpi-label">Duración promedio proceso</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num">23%</div>
      <div class="analytics-kpi-label">Procesos cancelados</div>
    </div>
  </div>
  <div class="analytics-content-grid">
    <div class="analytics-table-mock">
      <table>
        <thead>
          <tr><th>Provincia</th><th>Contratos</th><th>Monto</th><th>%</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Pichincha</td><td>1,847</td><td>$142M</td>
            <td><div class="progress-bar-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:82%;background:#3b82f6"></div></div><span class="progress-val">82%</span></div></td>
          </tr>
          <tr>
            <td>Guayas</td><td>1,203</td><td>$98M</td>
            <td><div class="progress-bar-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:56%;background:#8b5cf6"></div></div><span class="progress-val">56%</span></div></td>
          </tr>
          <tr>
            <td>Azuay</td><td>487</td><td>$31M</td>
            <td><div class="progress-bar-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:22%;background:#06b6d4"></div></div><span class="progress-val">22%</span></div></td>
          </tr>
          <tr>
            <td>Manabí</td><td>312</td><td>$18M</td>
            <td><div class="progress-bar-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:14%;background:#22c55e"></div></div><span class="progress-val">14%</span></div></td>
          </tr>
          <tr>
            <td>Tungurahua</td><td>198</td><td>$9.4M</td>
            <td><div class="progress-bar-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:8%;background:#f59e0b"></div></div><span class="progress-val">8%</span></div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="analytics-insights">
      <div class="analytics-insight" style="--insight-color:#22c55e">
        <div class="analytics-insight-title">🗺️ Concentración Territorial</div>
        <div class="analytics-insight-text">Pichincha y Guayas concentran el 68% del gasto público, revelando posible inequidad en la distribución de contratos a nivel nacional.</div>
      </div>
      <div class="analytics-insight" style="--insight-color:#a855f7">
        <div class="analytics-insight-title">⏱️ Tiempo por Tipo de Proceso</div>
        <div class="analytics-insight-text">Licitación: 67 días promedio · Cotización: 31 días · Menor Cuantía: 14 días. Los procesos más largos tienen 3× más riesgo de cancelación.</div>
      </div>
      <div class="analytics-insight" style="--insight-color:#f59e0b">
        <div class="analytics-insight-title">⚠️ Alerta de Ineficiencia</div>
        <div class="analytics-insight-text">23% de procesos cancelados, con pico en procesos de Licitación Pública (+38%). Costo oculto estimado: $4.2M en recursos administrativos.</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
  NEW SLIDE E – SAVINGS + MIPYME + EMERGENCY
════════════════════════════════════════ -->
<div class="slide slide-analytics-module slide-emergency" id="slide-new-savings">
  <div class="analytics-module-header">
    <div class="slide-label">Nuevos módulos · Impacto fiscal & social</div>
    <h2 class="slide-title">💰 Ahorros · 🏭 MIPYME · <span style="color:#ef4444">🚨 Emergencias</span></h2>
  </div>
  <div class="analytics-kpis">
    <div class="analytics-kpi">
      <div class="analytics-kpi-num" style="background:linear-gradient(135deg,#4ade80,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">$28.4M</div>
      <div class="analytics-kpi-label">Ahorro estatal total</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num" style="background:linear-gradient(135deg,#fb923c,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">34%</div>
      <div class="analytics-kpi-label">Contratos a MIPYME</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num" style="background:linear-gradient(135deg,#f87171,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">47</div>
      <div class="analytics-kpi-label">Contratos emergencia</div>
    </div>
    <div class="analytics-kpi">
      <div class="analytics-kpi-num" style="background:linear-gradient(135deg,#f87171,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">8.3%</div>
      <div class="analytics-kpi-label">% monto en emergencia</div>
    </div>
  </div>
  <div class="analytics-content-grid">
    <div class="analytics-table-mock">
      <table>
        <thead>
          <tr><th>Tipo Proceso</th><th>Estimado</th><th>Adjudicado</th><th>Ahorro</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Licitación</td><td>$48.2M</td><td>$39.7M</td>
            <td style="color:#4ade80;font-weight:700">17.6% ↓</td>
          </tr>
          <tr>
            <td>Cotización</td><td>$12.1M</td><td>$10.3M</td>
            <td style="color:#4ade80;font-weight:700">14.9% ↓</td>
          </tr>
          <tr>
            <td>Menor Cuantía</td><td>$3.8M</td><td>$3.6M</td>
            <td style="color:#facc15;font-weight:700">5.3% ↓</td>
          </tr>
          <tr>
            <td style="color:#f87171">🚨 Emergencia</td><td>$11.4M</td><td>$11.9M</td>
            <td style="color:#ef4444;font-weight:700">−4.4% ↑</td>
          </tr>
          <tr>
            <td>Régimen Especial</td><td>$5.9M</td><td>$5.2M</td>
            <td style="color:#4ade80;font-weight:700">11.9% ↓</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="analytics-insights">
      <div class="analytics-insight" style="--insight-color:#22c55e">
        <div class="analytics-insight-title">💰 Ahorros por Competencia</div>
        <div class="analytics-insight-text">Los procesos competitivos (Licitación) generan en promedio 17.6% de ahorro sobre el estimado. Los procesos directos solo 5.3%.</div>
      </div>
      <div class="analytics-insight" style="--insight-color:#fb923c">
        <div class="analytics-insight-title">🏭 MIPYME: 34% de contratos</div>
        <div class="analytics-insight-text">34% de contratos adjudicados a micro, pequeña y mediana empresa. Meta política: 50%. Brecha de 16% requiere acciones de inclusión.</div>
      </div>
      <div class="analytics-insight" style="--insight-color:#ef4444">
        <div class="analytics-insight-title">🚨 Emergencias cuestan más</div>
        <div class="analytics-insight-text">Los contratos de emergencia superan el estimado en 4.4% promedio — sin competencia y sin control preventivo. Alto riesgo de sobreprecios.</div>
      </div>
    </div>
  </div>
</div>
`;

// ── Closing slide update ──────────────────────────────────────────────────
const V2_CLOSING_OVERRIDE = `<div class="slide slide-closing" id="slide-13">
  <div class="closing-ring ring-3"></div>
  <div class="closing-ring ring-2"></div>
  <div class="closing-ring ring-1"></div>
  <div class="closing-icon">🏛️</div>
  <h2 class="closing-title">16 módulos. Los datos<br>hablan solos.</h2>
  <p class="closing-subtitle">580 contratos · 616 alertas · 5 nuevos módulos · Drill-down completo</p>
  <p style="color:var(--gray-400);font-size:14px;margin-top:16px;position:relative;max-width:500px;line-height:1.7">
    La plataforma v2 cierra todas las brechas analíticas: geografía, eficiencia, ahorros, MIPYME y emergencias. El SOCE del futuro existe hoy.
  </p>
  <div class="closing-actions">
    <a href="#" class="btn-primary" onclick="navigate(-${V2_TOTAL - 1})">← Ver desde el inicio</a>
    <a href="http://localhost:5177/analytics" target="_blank" class="btn-secondary">🚀 Demo en vivo</a>
  </div>
</div>`;

// ── Main builder ──────────────────────────────────────────────────────────
function buildV2() {
  console.log('Reading v1 presentation...');
  let html = fs.readFileSync(V1_FILE, 'utf8');

  // 1. Update title
  html = html.replace(
    '<title>Plataforma Analítica SERCOP – Presentación Ejecutiva</title>',
    '<title>Plataforma Analítica SERCOP v2 – Drill-Down + 5 Módulos Nuevos</title>'
  );

  // 2. Inject v2 CSS before closing </style>
  html = html.replace('</style>', V2_CSS + '\n</style>');

  // 3. Add v2 badge after <body>
  html = html.replace(
    '<div class="deck">',
    '<div class="v2-badge">v2.0</div>\n<div class="deck">'
  );

  // 4. Inject new slides before the closing slide
  html = html.replace(
    '<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING',
    NEW_SLIDES_HTML + '\n<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING'
  );

  // 5. Update closing slide content
  html = html.replace(
    /<div class="slide slide-closing" id="slide-13">[\s\S]*?<\/div>\s*\n\s*<\/div><!-- \/deck -->/,
    V2_CLOSING_OVERRIDE + '\n\n</div><!-- /deck -->'
  );

  // 6. Update TOTAL slides count in JS
  html = html.replace(
    `const TOTAL = ${V1_TOTAL};`,
    `const TOTAL = ${V2_TOTAL};`
  );

  // 7. Update navigate(-13) in closing button (v1) → v2 total
  html = html.replace(
    `onclick="navigate(-13)"`,
    `onclick="navigate(-${V2_TOTAL - 1})"`
  );

  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log(`✅ v2 presentation saved → ${OUT_FILE}`);
  console.log(`   Total slides: ${V2_TOTAL} (was ${V1_TOTAL})`);
  console.log(`   File size: ${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)} MB`);
}

buildV2();
