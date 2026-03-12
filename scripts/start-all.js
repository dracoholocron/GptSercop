#!/usr/bin/env node
/**
 * Script unificado: levanta infra (Docker), espera a la API y arranca todos los portales en desarrollo.
 * Uso: npm run start:all
 * Requiere: Docker (postgres, redis, minio, api, gateway, public-portal ya en compose).
 * Levanta además: admin (3004), supplier (3002), entity (3003) con concurrently.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_URL = process.env.API_URL || 'http://localhost:3080';
const HEALTH_PATH = new URL('/health', API_URL).pathname;
const WAIT_MS = 3000;
const MAX_ATTEMPTS = 30;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: ROOT,
      stdio: opts.silent ? 'pipe' : 'inherit',
      shell: true,
      ...opts,
    });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} → ${code}`))));
    p.on('error', reject);
  });
}

function waitForApi() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const u = new URL(API_URL);
    const port = u.port || (u.protocol === 'https:' ? 443 : 80);
    function tick() {
      attempts++;
      const req = http.request(
        {
          hostname: u.hostname,
          port,
          path: HEALTH_PATH,
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          if (res.statusCode === 200) return resolve();
          if (attempts >= MAX_ATTEMPTS) return reject(new Error('API no respondió 200'));
          setTimeout(tick, WAIT_MS);
        }
      );
      req.on('error', () => {
        if (attempts >= MAX_ATTEMPTS) return reject(new Error('API no disponible'));
        setTimeout(tick, WAIT_MS);
      });
      req.on('timeout', () => {
        req.destroy();
        if (attempts >= MAX_ATTEMPTS) return reject(new Error('API timeout'));
        setTimeout(tick, WAIT_MS);
      });
      req.end();
    }
    setTimeout(tick, WAIT_MS);
  });
}

async function main() {
  console.log('SERCOP – Arranque unificado de todos los módulos\n');

  console.log('1/3 Levantando Docker (postgres, redis, minio, api, gateway, public-portal)...');
  await run('docker', ['compose', 'up', '-d'], { silent: false }).catch((e) => {
    console.warn('Docker compose falló (¿Docker en marcha?):', e.message);
    console.log('Continuando por si la API ya está levantada...\n');
  });

  console.log('2/3 Esperando a que la API responda en', API_URL, '...');
  try {
    await waitForApi();
    console.log('   API lista.\n');
  } catch (e) {
    console.error('   ', e.message);
    console.log('   Ejecuta manualmente: npm run docker:up  y  npm run db:setup\n');
    process.exit(1);
  }

  console.log('3/3 Levantando portales (admin 3004, supplier 3002, entity 3003)...');
  console.log('   Detener con Ctrl+C.\n');
  await run('npm', ['run', 'dev:portales'], { stdio: 'inherit' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
