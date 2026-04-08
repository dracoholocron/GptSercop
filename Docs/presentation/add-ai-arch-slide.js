/**
 * Injects the AI & Analytics Architecture slide into the existing presentation.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'sercop-analytics-presentation.html');
let html = fs.readFileSync(FILE, 'utf-8');

// ─── AI Architecture SVG ────────────────────────────────────────────
const aiArchSVG = `<svg viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;height:100%;font-family:'Segoe UI',system-ui,sans-serif">
<defs>
  <linearGradient id="aiG1" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#1d4ed8;stop-opacity:1"/>
    <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1"/>
  </linearGradient>
  <linearGradient id="aiG2" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#059669;stop-opacity:1"/>
    <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1"/>
  </linearGradient>
  <linearGradient id="aiG3" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#b45309;stop-opacity:1"/>
    <stop offset="100%" style="stop-color:#d97706;stop-opacity:1"/>
  </linearGradient>
  <linearGradient id="aiG4" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1"/>
    <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1"/>
  </linearGradient>
  <linearGradient id="aiG5" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1"/>
    <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
  </linearGradient>
  <filter id="ai-glow">
    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="ai-shadow">
    <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <marker id="ai-arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="rgba(148,163,184,0.5)"/>
  </marker>
  <marker id="ai-arr-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="rgba(96,165,250,0.8)"/>
  </marker>
  <marker id="ai-arr-green" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="rgba(74,222,128,0.8)"/>
  </marker>
  <marker id="ai-arr-purple" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="rgba(196,181,253,0.8)"/>
  </marker>
  <marker id="ai-arr-orange" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="rgba(253,186,116,0.8)"/>
  </marker>
</defs>

<!-- BG -->
<rect width="1000" height="560" fill="#070d1a" rx="0"/>

<!-- ══════════════════════════════════════════
     ROW BACKGROUNDS (swimlanes)
══════════════════════════════════════════ -->

<!-- Row 1: Data Sources -->
<rect x="0" y="0" width="1000" height="92" fill="rgba(30,41,59,0.5)"/>
<text x="16" y="16" fill="rgba(148,163,184,0.35)" font-size="9" font-weight="700" letter-spacing="2">DATA SOURCES</text>

<!-- Row 2: Ingestion / ETL -->
<rect x="0" y="92" width="1000" height="88" fill="rgba(15,23,42,0.7)"/>
<text x="16" y="107" fill="rgba(148,163,184,0.35)" font-size="9" font-weight="700" letter-spacing="2">INGESTION &amp; ETL PIPELINE</text>

<!-- Row 3: Knowledge Layer -->
<rect x="0" y="180" width="1000" height="116" fill="rgba(30,41,59,0.4)"/>
<text x="16" y="195" fill="rgba(196,181,253,0.5)" font-size="9" font-weight="700" letter-spacing="2">KNOWLEDGE LAYER  ·  SEMANTIC + GRAPH + DATA MART</text>

<!-- Row 4: Intelligence Engine -->
<rect x="0" y="296" width="1000" height="140" fill="rgba(15,23,42,0.7)"/>
<text x="16" y="311" fill="rgba(96,165,250,0.5)" font-size="9" font-weight="700" letter-spacing="2">INTELLIGENCE ENGINE  ·  RISK · ANOMALY · PREDICTION · SCORING</text>

<!-- Row 5: API / Output -->
<rect x="0" y="436" width="1000" height="124" fill="rgba(30,41,59,0.5)"/>
<text x="16" y="451" fill="rgba(74,222,128,0.5)" font-size="9" font-weight="700" letter-spacing="2">ANALYTICS API + CONSUMER LAYER</text>


<!-- ══════════════════════════════════════════
     ROW 1 – DATA SOURCES
══════════════════════════════════════════ -->

<!-- SERCOP Processes -->
<rect x="24" y="20" width="130" height="58" rx="10" fill="rgba(29,78,216,0.2)" stroke="rgba(59,130,246,0.45)" stroke-width="1.5"/>
<text x="89" y="40" fill="white" font-size="18" text-anchor="middle">📄</text>
<text x="89" y="56" fill="#93c5fd" font-size="10" font-weight="700" text-anchor="middle">Procesos SERCOP</text>
<text x="89" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Tender · Bid · Contract</text>

<!-- CPC Taxonomy -->
<rect x="172" y="20" width="130" height="58" rx="10" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.45)" stroke-width="1.5"/>
<text x="237" y="40" fill="white" font-size="18" text-anchor="middle">🏷️</text>
<text x="237" y="56" fill="#d8b4fe" font-size="10" font-weight="700" text-anchor="middle">Catálogo CPC</text>
<text x="237" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Taxonomía de productos</text>

<!-- Entities/Providers -->
<rect x="320" y="20" width="130" height="58" rx="10" fill="rgba(5,150,105,0.2)" stroke="rgba(34,197,94,0.45)" stroke-width="1.5"/>
<text x="385" y="40" fill="white" font-size="18" text-anchor="middle">🏢</text>
<text x="385" y="56" fill="#86efac" font-size="10" font-weight="700" text-anchor="middle">Entidades / RUP</text>
<text x="385" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Entity · Provider · User</text>

<!-- Normativa (RAG docs) -->
<rect x="468" y="20" width="130" height="58" rx="10" fill="rgba(180,83,9,0.2)" stroke="rgba(251,146,60,0.45)" stroke-width="1.5"/>
<text x="533" y="40" fill="white" font-size="18" text-anchor="middle">📚</text>
<text x="533" y="56" fill="#fdba74" font-size="10" font-weight="700" text-anchor="middle">Normativa Legal</text>
<text x="533" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">LOSNCP · Reglamentos · FAQ</text>

<!-- PAC -->
<rect x="616" y="20" width="130" height="58" rx="10" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.45)" stroke-width="1.5"/>
<text x="681" y="40" fill="white" font-size="18" text-anchor="middle">📋</text>
<text x="681" y="56" fill="#67e8f9" font-size="10" font-weight="700" text-anchor="middle">PAC / Presupuesto</text>
<text x="681" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">ProcurementPlan · Budget</text>

<!-- Amendments/Alerts -->
<rect x="764" y="20" width="130" height="58" rx="10" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.45)" stroke-width="1.5"/>
<text x="829" y="40" fill="white" font-size="18" text-anchor="middle">📝</text>
<text x="829" y="56" fill="#fca5a5" font-size="10" font-weight="700" text-anchor="middle">Contratos / Enmiendas</text>
<text x="829" y="68" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">Contract · Amendment</text>


<!-- ══════════════════════════════════════════
     ROW 2 – ETL PIPELINE
══════════════════════════════════════════ -->

<!-- Down arrows from sources -->
<line x1="89"  y1="78" x2="89"  y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>
<line x1="237" y1="78" x2="237" y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>
<line x1="385" y1="78" x2="385" y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>
<line x1="533" y1="78" x2="533" y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>
<line x1="681" y1="78" x2="681" y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>
<line x1="829" y1="78" x2="829" y2="102" stroke="rgba(148,163,184,0.2)" stroke-width="1" marker-end="url(#ai-arr)"/>

<!-- ETL steps -->
<rect x="24"  y="103" width="130" height="56" rx="10" fill="rgba(29,78,216,0.12)" stroke="rgba(59,130,246,0.25)" stroke-width="1"/>
<text x="89"  y="124" fill="#93c5fd" font-size="9" font-weight="700" text-anchor="middle">🔄 Prisma ORM</text>
<text x="89"  y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">seed.ts + upserts</text>
<text x="89"  y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">PostgreSQL write</text>

<rect x="172" y="103" width="130" height="56" rx="10" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.25)" stroke-width="1"/>
<text x="237" y="124" fill="#d8b4fe" font-size="9" font-weight="700" text-anchor="middle">🌳 CPC Importer</text>
<text x="237" y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">import-cpc.ts</text>
<text x="237" y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">Tree normalization</text>

<rect x="320" y="103" width="130" height="56" rx="10" fill="rgba(5,150,105,0.12)" stroke="rgba(34,197,94,0.25)" stroke-width="1"/>
<text x="385" y="124" fill="#86efac" font-size="9" font-weight="700" text-anchor="middle">📥 OCDS Ingesta</text>
<text x="385" y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">import-ocds-synthetic.ts</text>
<text x="385" y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">Open Contracting Std</text>

<rect x="468" y="103" width="130" height="56" rx="10" fill="rgba(180,83,9,0.12)" stroke="rgba(251,146,60,0.25)" stroke-width="1"/>
<text x="533" y="124" fill="#fdba74" font-size="9" font-weight="700" text-anchor="middle">📖 RAG Chunker</text>
<text x="533" y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">rag.ts · tsvector</text>
<text x="533" y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">Full-text (Spanish)</text>

<rect x="616" y="103" width="130" height="56" rx="10" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.25)" stroke-width="1"/>
<text x="681" y="124" fill="#67e8f9" font-size="9" font-weight="700" text-anchor="middle">📊 Analytics Seed</text>
<text x="681" y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">seed-analytics.ts</text>
<text x="681" y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">109 scenarios</text>

<rect x="764" y="103" width="130" height="56" rx="10" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.25)" stroke-width="1"/>
<text x="829" y="124" fill="#fca5a5" font-size="9" font-weight="700" text-anchor="middle">⚙️ Compute All</text>
<text x="829" y="137" fill="rgba(148,163,184,0.6)" font-size="8" text-anchor="middle">compute-all-analytics.ts</text>
<text x="829" y="149" fill="rgba(148,163,184,0.5)" font-size="8" text-anchor="middle">Batch pipeline</text>


<!-- ══════════════════════════════════════════
     ROW 3 – KNOWLEDGE LAYER
══════════════════════════════════════════ -->

<!-- Down arrows from ETL row to Knowledge layer -->
<line x1="89"  y1="159" x2="180" y2="192" stroke="rgba(96,165,250,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr-blue)"/>
<line x1="237" y1="159" x2="237" y2="192" stroke="rgba(196,181,253,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr-purple)"/>
<line x1="385" y1="159" x2="385" y2="192" stroke="rgba(74,222,128,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr-green)"/>
<line x1="533" y1="159" x2="533" y2="192" stroke="rgba(253,186,116,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr-orange)"/>
<line x1="681" y1="159" x2="681" y2="192" stroke="rgba(103,232,249,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr)"/>
<line x1="829" y1="159" x2="750" y2="192" stroke="rgba(239,68,68,0.3)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ai-arr)"/>

<!-- ── 1. PostgreSQL Data Mart ── -->
<rect x="24" y="193" width="200" height="88" rx="12" fill="rgba(29,78,216,0.15)" stroke="rgba(59,130,246,0.4)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="124" y="213" fill="#93c5fd" font-size="11" font-weight="800" text-anchor="middle">🗄️ DATA MART</text>
<text x="124" y="228" fill="rgba(147,197,253,0.8)" font-size="9" text-anchor="middle">PostgreSQL 16</text>
<text x="36"  y="244" fill="rgba(148,163,184,0.7)" font-size="8">▸ RiskScore (5 dims, weighted)</text>
<text x="36"  y="256" fill="rgba(148,163,184,0.7)" font-size="8">▸ PriceReference (CPC benchmark)</text>
<text x="36"  y="268" fill="rgba(148,163,184,0.7)" font-size="8">▸ ProviderScore (4 dims + tier)</text>
<text x="36"  y="280" fill="rgba(148,163,184,0.7)" font-size="8">▸ FragmentationAlert (clusters)</text>

<!-- ── 2. CPC Semantic Graph ── -->
<rect x="242" y="193" width="198" height="88" rx="12" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="341" y="213" fill="#d8b4fe" font-size="11" font-weight="800" text-anchor="middle">🌳 SEMANTIC GRAPH</text>
<text x="341" y="228" fill="rgba(216,180,254,0.8)" font-size="9" text-anchor="middle">CpcNode · CpcEdge · Taxonomy</text>
<text x="254" y="244" fill="rgba(148,163,184,0.7)" font-size="8">▸ Jerarquía de productos/servicios</text>
<text x="254" y="256" fill="rgba(148,163,184,0.7)" font-size="8">▸ Árbol CPC SERCOP (7 niveles)</text>
<text x="254" y="268" fill="rgba(148,163,184,0.7)" font-size="8">▸ Clasificación semántica de items</text>
<text x="254" y="280" fill="rgba(148,163,184,0.7)" font-size="8">▸ Linked to RagChunk (normativa)</text>

<!-- ── 3. RAG Knowledge Base ── -->
<rect x="458" y="193" width="198" height="88" rx="12" fill="rgba(180,83,9,0.15)" stroke="rgba(251,146,60,0.4)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="557" y="213" fill="#fdba74" font-size="11" font-weight="800" text-anchor="middle">📖 RAG KNOWLEDGE BASE</text>
<text x="557" y="228" fill="rgba(253,186,116,0.8)" font-size="9" text-anchor="middle">PostgreSQL tsvector (Spanish NLP)</text>
<text x="470" y="244" fill="rgba(148,163,184,0.7)" font-size="8">▸ Normativa LOSNCP + Reglamentos</text>
<text x="470" y="256" fill="rgba(148,163,184,0.7)" font-size="8">▸ Manuales SERCOP · Resoluciones</text>
<text x="470" y="268" fill="rgba(148,163,184,0.7)" font-size="8">▸ ts_headline (snippets) + ts_rank</text>
<text x="470" y="280" fill="rgba(148,163,184,0.7)" font-size="8">▸ Búsqueda semántica full-text</text>

<!-- ── 4. Provider Network Graph ── -->
<rect x="674" y="193" width="298" height="88" rx="12" fill="rgba(5,150,105,0.15)" stroke="rgba(34,197,94,0.4)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="823" y="213" fill="#86efac" font-size="11" font-weight="800" text-anchor="middle">🕸️ PROVIDER NETWORK GRAPH</text>
<text x="823" y="228" fill="rgba(134,239,172,0.8)" font-size="9" text-anchor="middle">ProviderRelation · Graph Analysis</text>
<text x="686" y="244" fill="rgba(148,163,184,0.7)" font-size="8">▸ Nodos: Proveedores (185 entidades)</text>
<text x="686" y="256" fill="rgba(148,163,184,0.7)" font-size="8">▸ Aristas: Licitaciones compartidas (53+)</text>
<text x="686" y="268" fill="rgba(148,163,184,0.7)" font-size="8">▸ Detección colusión: pares y triángulos</text>
<text x="686" y="280" fill="rgba(148,163,184,0.7)" font-size="8">▸ Análisis vecinos + clusters sospechosos</text>


<!-- ══════════════════════════════════════════
     ROW 4 – INTELLIGENCE ENGINE
══════════════════════════════════════════ -->

<!-- Arrows from knowledge layer down -->
<line x1="124" y1="281" x2="124" y2="310" stroke="rgba(96,165,250,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-blue)"/>
<line x1="341" y1="281" x2="300" y2="310" stroke="rgba(196,181,253,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-purple)"/>
<line x1="557" y1="281" x2="490" y2="310" stroke="rgba(253,186,116,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-orange)"/>
<line x1="823" y1="281" x2="700" y2="310" stroke="rgba(74,222,128,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-green)"/>

<!-- ── 1. Risk Engine ── -->
<rect x="24" y="310" width="185" height="110" rx="12" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="34" y="329" fill="#fca5a5" font-size="11" font-weight="800">🧠 RISK ENGINE</text>
<text x="34" y="343" fill="rgba(252,165,165,0.7)" font-size="8">risk-engine.ts</text>
<text x="34" y="357" fill="rgba(148,163,184,0.7)" font-size="8">▸ 5 dims (competition 25%,</text>
<text x="34" y="368" fill="rgba(148,163,184,0.7)" font-size="8">  price 20%, supplier 20%,</text>
<text x="34" y="379" fill="rgba(148,163,184,0.7)" font-size="8">  process 15%, execution 20%)</text>
<text x="34" y="390" fill="rgba(148,163,184,0.7)" font-size="8">▸ 20 patrones estadísticos</text>
<text x="34" y="401" fill="rgba(148,163,184,0.7)" font-size="8">▸ Score 0-100 por proceso</text>
<text x="34" y="412" fill="rgba(148,163,184,0.7)" font-size="8">▸ HHI · CV · Z-score análisis</text>

<!-- ── 2. Anomaly Detection ── -->
<rect x="224" y="310" width="185" height="110" rx="12" fill="rgba(251,146,60,0.15)" stroke="rgba(251,146,60,0.5)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="234" y="329" fill="#fdba74" font-size="11" font-weight="800">🔍 ANOMALY DETECTION</text>
<text x="234" y="343" fill="rgba(253,186,116,0.7)" font-size="8">price-index.ts · fragmentation.ts</text>
<text x="234" y="357" fill="rgba(148,163,184,0.7)" font-size="8">▸ Precio: desv &gt;50% del promedio</text>
<text x="234" y="368" fill="rgba(148,163,184,0.7)" font-size="8">  CPC cross-entidad</text>
<text x="234" y="379" fill="rgba(148,163,184,0.7)" font-size="8">▸ Clustering temporal (30 días)</text>
<text x="234" y="390" fill="rgba(148,163,184,0.7)" font-size="8">▸ AMOUNT_CLUSTER ±20% monto</text>
<text x="234" y="401" fill="rgba(148,163,184,0.7)" font-size="8">▸ THRESHOLD_AVOIDANCE &lt;umbral</text>
<text x="234" y="412" fill="rgba(148,163,184,0.7)" font-size="8">▸ Concentración regional (HHI)</text>

<!-- ── 3. Predictive Model ── -->
<rect x="424" y="310" width="185" height="110" rx="12" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.5)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="434" y="329" fill="#67e8f9" font-size="11" font-weight="800">🔮 PREDICTIVE MODEL</text>
<text x="434" y="343" fill="rgba(103,232,249,0.7)" font-size="8">predictive.ts  (pre-award)</text>
<text x="434" y="357" fill="rgba(148,163,184,0.7)" font-size="8">▸ bidCountRisk (25%)</text>
<text x="434" y="368" fill="rgba(148,163,184,0.7)" font-size="8">▸ bidConcentrationRisk (15%)</text>
<text x="434" y="379" fill="rgba(148,163,184,0.7)" font-size="8">▸ entityHistoricalRisk (25%)</text>
<text x="434" y="390" fill="rgba(148,163,184,0.7)" font-size="8">▸ processTypeRisk (20%)</text>
<text x="434" y="401" fill="rgba(148,163,184,0.7)" font-size="8">▸ emergencyRisk (15%)</text>
<text x="434" y="412" fill="rgba(148,163,184,0.7)" font-size="8">▸ Confidence via √sampleSize</text>

<!-- ── 4. Scoring Models ── -->
<rect x="624" y="310" width="185" height="110" rx="12" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.5)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="634" y="329" fill="#d8b4fe" font-size="11" font-weight="800">⭐ SCORING MODELS</text>
<text x="634" y="343" fill="rgba(216,180,254,0.7)" font-size="8">provider-score.ts  (4 dims)</text>
<text x="634" y="357" fill="rgba(148,163,184,0.7)" font-size="8">▸ Compliance: contratos OK (30%)</text>
<text x="634" y="368" fill="rgba(148,163,184,0.7)" font-size="8">▸ Delivery: extensiones plazo (25%)</text>
<text x="634" y="379" fill="rgba(148,163,184,0.7)" font-size="8">▸ Price: win-rate + ref ratio (25%)</text>
<text x="634" y="390" fill="rgba(148,163,184,0.7)" font-size="8">▸ Diversity: entidades servidas (20%)</text>
<text x="634" y="401" fill="rgba(148,163,184,0.7)" font-size="8">▸ Tier: premium / standard /</text>
<text x="634" y="412" fill="rgba(148,163,184,0.7)" font-size="8">  watch / restricted</text>

<!-- ── 5. Alert Engine ── -->
<rect x="824" y="310" width="148" height="110" rx="12" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.5)" stroke-width="1.5" filter="url(#ai-shadow)"/>
<text x="834" y="329" fill="#86efac" font-size="11" font-weight="800">🔔 ALERT ENGINE</text>
<text x="834" y="343" fill="rgba(134,239,172,0.7)" font-size="8">alerts.ts  (dedup + persist)</text>
<text x="834" y="357" fill="rgba(148,163,184,0.7)" font-size="8">▸ 21 alert types</text>
<text x="834" y="368" fill="rgba(148,163,184,0.7)" font-size="8">▸ CRITICAL / WARN / INFO</text>
<text x="834" y="379" fill="rgba(148,163,184,0.7)" font-size="8">▸ Dedup por tenderId+type</text>
<text x="834" y="390" fill="rgba(148,163,184,0.7)" font-size="8">▸ 616 alertas activas</text>
<text x="834" y="401" fill="rgba(148,163,184,0.7)" font-size="8">▸ resolve() con trazabilidad</text>
<text x="834" y="412" fill="rgba(148,163,184,0.7)" font-size="8">▸ metadata JSON enriquecida</text>

<!-- Cross-connects inside intelligence row -->
<line x1="209" y1="365" x2="224" y2="365" stroke="rgba(148,163,184,0.2)" stroke-width="1" stroke-dasharray="2,3" marker-end="url(#ai-arr)"/>
<line x1="409" y1="365" x2="424" y2="365" stroke="rgba(148,163,184,0.2)" stroke-width="1" stroke-dasharray="2,3" marker-end="url(#ai-arr)"/>
<line x1="609" y1="365" x2="624" y2="365" stroke="rgba(148,163,184,0.2)" stroke-width="1" stroke-dasharray="2,3" marker-end="url(#ai-arr)"/>
<line x1="809" y1="365" x2="824" y2="365" stroke="rgba(148,163,184,0.2)" stroke-width="1" stroke-dasharray="2,3" marker-end="url(#ai-arr)"/>


<!-- ══════════════════════════════════════════
     ROW 5 – API OUTPUT LAYER
══════════════════════════════════════════ -->

<!-- Arrows down from engines -->
<line x1="116" y1="420" x2="116" y2="450" stroke="rgba(96,165,250,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-blue)"/>
<line x1="316" y1="420" x2="280" y2="450" stroke="rgba(253,186,116,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-orange)"/>
<line x1="516" y1="420" x2="450" y2="450" stroke="rgba(103,232,249,0.4)" stroke-width="1.5" marker-end="url(#ai-arr)"/>
<line x1="716" y1="420" x2="640" y2="450" stroke="rgba(196,181,253,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-purple)"/>
<line x1="898" y1="420" x2="820" y2="450" stroke="rgba(74,222,128,0.4)" stroke-width="1.5" marker-end="url(#ai-arr-green)"/>

<!-- REST API box -->
<rect x="24" y="452" width="200" height="90" rx="12" fill="rgba(29,78,216,0.18)" stroke="rgba(59,130,246,0.5)" stroke-width="1.5"/>
<text x="124" y="472" fill="#93c5fd" font-size="11" font-weight="800" text-anchor="middle">🌐 REST API  /api/v1/analytics</text>
<text x="36"  y="490" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /dashboard · /risk-scores</text>
<text x="36"  y="502" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /competition · /market · /pac</text>
<text x="36"  y="514" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /provider-network · /scores</text>
<text x="36"  y="526" fill="rgba(148,163,184,0.7)" font-size="8">▸ POST /compute-risk · /detect-frag</text>

<!-- RAG API -->
<rect x="242" y="452" width="180" height="90" rx="12" fill="rgba(180,83,9,0.18)" stroke="rgba(251,146,60,0.5)" stroke-width="1.5"/>
<text x="332" y="472" fill="#fdba74" font-size="11" font-weight="800" text-anchor="middle">🔍 RAG Search API</text>
<text x="254" y="490" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /api/v1/rag/search?q=</text>
<text x="254" y="502" fill="rgba(148,163,184,0.7)" font-size="8">▸ plainto_tsquery (Spanish)</text>
<text x="254" y="514" fill="rgba(148,163,184,0.7)" font-size="8">▸ ts_headline · ts_rank</text>
<text x="254" y="526" fill="rgba(148,163,184,0.7)" font-size="8">▸ Snippets de normativa</text>

<!-- Predictive API -->
<rect x="440" y="452" width="180" height="90" rx="12" fill="rgba(6,182,212,0.18)" stroke="rgba(6,182,212,0.5)" stroke-width="1.5"/>
<text x="530" y="472" fill="#67e8f9" font-size="11" font-weight="800" text-anchor="middle">🔮 Predictive API</text>
<text x="452" y="490" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /risk-prediction/:tenderId</text>
<text x="452" y="502" fill="rgba(148,163,184,0.7)" font-size="8">▸ predictedScore + predictedLevel</text>
<text x="452" y="514" fill="rgba(148,163,184,0.7)" font-size="8">▸ factors breakdown (5 dims)</text>
<text x="452" y="526" fill="rgba(148,163,184,0.7)" font-size="8">▸ confidence % by sample size</text>

<!-- CPC Semantic API -->
<rect x="638" y="452" width="180" height="90" rx="12" fill="rgba(168,85,247,0.18)" stroke="rgba(168,85,247,0.5)" stroke-width="1.5"/>
<text x="728" y="472" fill="#d8b4fe" font-size="11" font-weight="800" text-anchor="middle">🌳 CPC Semantic API</text>
<text x="650" y="490" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /api/v1/cpc/tree</text>
<text x="650" y="502" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /cpc/search/:query</text>
<text x="650" y="514" fill="rgba(148,163,184,0.7)" font-size="8">▸ Taxonomía jerárquica</text>
<text x="650" y="526" fill="rgba(148,163,184,0.7)" font-size="8">▸ Linked to normativa (RAG)</text>

<!-- Alerts API -->
<rect x="836" y="452" width="140" height="90" rx="12" fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.5)" stroke-width="1.5"/>
<text x="906" y="472" fill="#86efac" font-size="11" font-weight="800" text-anchor="middle">🔔 Alert API</text>
<text x="848" y="490" fill="rgba(148,163,184,0.7)" font-size="8">▸ GET  /alerts</text>
<text x="848" y="502" fill="rgba(148,163,184,0.7)" font-size="8">▸ PATCH /alerts/:id/resolve</text>
<text x="848" y="514" fill="rgba(148,163,184,0.7)" font-size="8">▸ severity filter</text>
<text x="848" y="526" fill="rgba(148,163,184,0.7)" font-size="8">▸ 616 activas</text>

<!-- Consumers label -->
<text x="500" y="553" fill="rgba(148,163,184,0.3)" font-size="9" text-anchor="middle" font-weight="600" letter-spacing="2">↑  CONSUMED BY: React Dashboard · Auditor Portal · Public Transparency · Future ML Models  ↑</text>
</svg>`;

// ─── Slide HTML ───────────────────────────────────────────────────────
const newSlide = `
<!-- ═══════════════════════════════════════
  SLIDE AI-ARCH – AI & Analytics Architecture
════════════════════════════════════════ -->
<div class="slide slide-aiarch" id="slide-aiarch">
  <div class="aiarch-header">
    <div class="slide-label" style="color:#fdba74;display:flex;align-items:center;gap:8px">
      <span style="display:block;width:24px;height:2px;background:#fb923c"></span>
      Arquitectura IA &amp; Analítica
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between">
      <h2 class="slide-title">Pipeline Cognitivo · RAG · Grafos · <span style="color:#fdba74">Modelos de Riesgo</span></h2>
      <div style="display:flex;gap:8px;padding-bottom:4px;flex-shrink:0">
        <span class="tech-pill pill-orange" style="font-size:11px">RAG NLP</span>
        <span class="tech-pill pill-purple" style="font-size:11px">Graph Analysis</span>
        <span class="tech-pill pill-blue" style="font-size:11px">Data Mart</span>
        <span class="tech-pill pill-green" style="font-size:11px">Statistical ML</span>
      </div>
    </div>
  </div>
  <div class="aiarch-diagram">
    ${aiArchSVG}
  </div>
</div>`;

// ─── Extra CSS ─────────────────────────────────────────────────────────
const extraCSS = `
  .slide-aiarch {
    background: linear-gradient(180deg, #070d1a 0%, #0a0f1a 100%);
    padding: 28px 48px 16px;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .aiarch-header { margin-bottom: 12px; flex-shrink: 0; }
  .aiarch-diagram {
    flex: 1;
    border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.06);
    min-height: 0;
  }
`;

// ─── Inject ───────────────────────────────────────────────────────────

// Get current total
const currentTotal = parseInt(html.match(/const TOTAL = (\d+);/)[1]);
const newTotal = currentTotal + 1;

// Update total
html = html.replace(`const TOTAL = ${currentTotal};`, `const TOTAL = ${newTotal};`);

// Add CSS
html = html.replace('</style>', extraCSS + '\n</style>');

// Insert before closing slide (last slide div before /deck)
html = html.replace(
  '<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING',
  newSlide + '\n\n<!-- ═══════════════════════════════════════\n  SLIDE 12 – CLOSING'
);

fs.writeFileSync(FILE, html, 'utf-8');
const size = fs.statSync(FILE).size;
console.log(`✅ AI Architecture slide added!`);
console.log(`   Total slides: ${newTotal}`);
console.log(`   File size: ${(size/1024/1024).toFixed(1)} MB`);
console.log(`\n   Open: open "${FILE}"`);
