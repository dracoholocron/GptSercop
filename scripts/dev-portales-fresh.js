#!/usr/bin/env node
/**
 * Limpia caché .next de los portales y arranca todos (incl. público en 3001).
 * Uso: node scripts/dev-portales-fresh.js  o  npm run dev:portales:fresh
 * Puertos: público 3001, proveedores 3002, entidad 3003, admin 3004.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const apps = ['public-portal', 'supplier-portal', 'entity-portal', 'sercop-admin'];

console.log('SERCOP – Limpiando caché .next de portales y arrancando…\n');

for (const app of apps) {
  const nextDir = path.join(ROOT, 'apps', app, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true });
    console.log('  Limpiado:', app);
  }
}

console.log('\nArrancando portales: público (3001), proveedores (3002), entidad (3003), admin (3004).\n');
const p = spawn('npm', ['run', 'dev:portales:full'], { cwd: ROOT, stdio: 'inherit', shell: true });
p.on('close', (code) => process.exit(code ?? 0));
p.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
