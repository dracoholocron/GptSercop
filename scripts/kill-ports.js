#!/usr/bin/env node
/**
 * Libera los puertos 3001-3004 y 3010 usados por los portales SERCOP.
 * Uso: node scripts/kill-ports.js
 * En Windows requiere ejecutar como administrador o que los procesos sean del usuario actual.
 */
const { execSync } = require('node:child_process');
const os = require('node:os');

const PORTS = [3001, 3002, 3003, 3004, 3010];
const isWin = os.platform() === 'win32';

function killPort(port) {
  try {
    if (isWin) {
      let out;
      try {
        out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e) {
        if (e.status === 1) { console.log(`  Puerto ${port}: libre`); return; }
        throw e;
      }
      const lines = out.trim().split('\n').filter((l) => l.includes('LISTENING'));
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
          console.log(`  Puerto ${port}: proceso ${pid} terminado`);
        } catch (_) {
          console.log(`  Puerto ${port}: no se pudo terminar PID ${pid} (¿ejecutar como administrador?)`);
        }
      }
      if (pids.size === 0) console.log(`  Puerto ${port}: libre`);
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'pipe' });
      console.log(`  Puerto ${port}: liberado`);
    }
  } catch (e) {
    console.log(`  Puerto ${port}: ${e.message}`);
  }
}

console.log('Liberando puertos 3001-3004, 3010...\n');
PORTS.forEach(killPort);
console.log('\nListo. Puede ejecutar npm run dev:public-portal, etc.');
