#!/usr/bin/env node
/**
 * Smoke test (Fase 0): comprueba que la API responde en /health y /api/v1/tenders.
 * Uso: con la API levantada (docker compose up -d y db:setup), ejecutar desde raíz:
 *   node scripts/smoke.js [BASE_URL]
 * Por defecto BASE_URL = http://localhost:3080
 */
const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3080';

async function fetchOk(url, label) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('Smoke test →', baseUrl);
  try {
    const health = await fetchOk(`${baseUrl}/health`, 'GET /health');
    if (health.status !== 'ok' && health.status !== 'degraded') {
      throw new Error(`/health status unexpected: ${health.status}`);
    }
    console.log('  GET /health:', health.status, health.database || '', health.redis || '');

    const ready = await fetchOk(`${baseUrl}/ready`, 'GET /ready');
    if (!ready.ready) throw new Error('/ready: expected ready true');
    console.log('  GET /ready: OK');

    const tenders = await fetchOk(`${baseUrl}/api/v1/tenders`, 'GET /api/v1/tenders');
    if (!Array.isArray(tenders.data)) throw new Error('/api/v1/tenders: missing data array');
    if (typeof tenders.total === 'number') console.log('  GET /api/v1/tenders:', tenders.data.length, 'items, total', tenders.total);
    else console.log('  GET /api/v1/tenders:', tenders.data.length, 'items');

    const tendersPage = await fetchOk(`${baseUrl}/api/v1/tenders?page=1&pageSize=10`, 'GET /api/v1/tenders?page=1&pageSize=10');
    if (!Array.isArray(tendersPage.data)) throw new Error('/api/v1/tenders pagination: missing data array');
    if (typeof tendersPage.total === 'number') console.log('  GET /api/v1/tenders?page=1&pageSize=10: OK (total', tendersPage.total + ')');
    else console.log('  GET /api/v1/tenders?page=1&pageSize=10: OK');

    const pac = await fetchOk(`${baseUrl}/api/v1/pac`, 'GET /api/v1/pac');
    if (!Array.isArray(pac.data)) throw new Error('/api/v1/pac: missing data array');
    console.log('  GET /api/v1/pac:', pac.data.length, 'items');

    const rag = await fetchOk(`${baseUrl}/api/v1/rag/search?q=normativa`, 'GET /api/v1/rag/search');
    if (!Array.isArray(rag.results)) throw new Error('/api/v1/rag/search: missing results array');
    console.log('  GET /api/v1/rag/search:', rag.results.length, 'results');

    try {
      const openapi = await fetchOk(`${baseUrl}/openapi.json`, 'GET /openapi.json');
      if (openapi && openapi.openapi && openapi.paths) console.log('  GET /openapi.json: OK');
    } catch (_) {
      console.log('  GET /openapi.json: no disponible (opcional)');
    }

    console.log('Smoke OK');
  } catch (e) {
    console.error('Smoke FAIL:', e.message);
    process.exit(1);
  }
}

main();
