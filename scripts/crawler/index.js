#!/usr/bin/env node
/**
 * Crawler SERCOP – recopila datos desde API o fuentes externas.
 * Uso:
 *   node scripts/crawler/index.js              – listar datos de la API
 *   node scripts/crawler/index.js --source=portal
 *   node scripts/crawler/index.js --seed      – ejecutar db:seed después (datos de prueba)
 *
 * Fuentes:
 * - portal: procesos y proveedores desde API SERCOP (CRAWLER_API_URL)
 * - datos_abiertos: OCDS (stub, configurar CRAWLER_OCDS_URL)
 */
const BASE_URL = process.env.CRAWLER_API_URL || 'http://localhost:3080';

const TASKS = [
  { source: 'portal', resource: 'tenders' },
  { source: 'portal', resource: 'providers' },
  { source: 'portal', resource: 'entities' },
  { source: 'datos_abiertos', resource: 'ocds_releases' },
];

async function crawlTask(task) {
  if (task.source === 'portal') {
    const pathMap = { tenders: '/api/v1/tenders', providers: '/api/v1/providers', entities: '/api/v1/entities' };
    const path = pathMap[task.resource];
    if (!path) return { task, count: 0 };
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    const data = await res.json();
    const count = data?.data?.length ?? 0;
    console.log(`  [${task.source}] ${task.resource}: ${count} items`);
    return { task, count };
  }
  if (task.source === 'datos_abiertos') {
    const ocdsUrl = process.env.CRAWLER_OCDS_URL;
    if (!ocdsUrl) {
      console.log(`  [${task.source}] ${task.resource}: configurar CRAWLER_OCDS_URL para datos OCDS`);
      return { task, count: 0 };
    }
    const res = await fetch(ocdsUrl);
    if (!res.ok) throw new Error(`OCDS: ${res.status}`);
    const data = await res.json();
    const count = data?.releases?.length ?? 0;
    console.log(`  [${task.source}] ${task.resource}: ${count} releases`);
    return { task, count };
  }
  return { task, count: 0 };
}

async function main() {
  const doSeed = process.argv.includes('--seed');
  const sourceFilter = process.argv.find((a) => a.startsWith('--source='))?.split('=')[1];
  const tasks = sourceFilter ? TASKS.filter((t) => t.source === sourceFilter) : TASKS;

  console.log('Crawler SERCOP – tareas:', tasks.length);
  for (const task of tasks) {
    try {
      await crawlTask(task);
    } catch (e) {
      console.error(`  Error ${task.source}/${task.resource}:`, e.message);
    }
  }
  console.log('Crawler OK');

  if (doSeed) {
    console.log('\nEjecutando db:seed para cargar datos de prueba...');
    const { execSync } = await import('node:child_process');
    execSync('npm run db:seed --workspace=api', { stdio: 'inherit', cwd: process.cwd() });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
