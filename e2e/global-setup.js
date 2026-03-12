/**
 * Global setup para E2E: ejecuta el seed de la BD antes de arrancar los servidores.
 * Así la API tiene procesos/publicaciones y la UI los muestra en los tests.
 * Si DATABASE_URL no está definido, se omite el seed (p. ej. CI sin BD).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

module.exports = async function globalSetup() {
  const root = path.resolve(__dirname, '..');
  loadEnv(path.join(root, '.env'));
  loadEnv(path.join(root, 'apps', 'api', '.env'));
  if (!process.env.DATABASE_URL) {
    if (process.env.CI) {
      console.log('[e2e] DATABASE_URL no definido (CI), se omite seed.');
      return;
    }
    process.env.DATABASE_URL = 'postgresql://sercop:sercop@localhost:5432/sercop';
  }
  try {
    execSync('npm run db:push --workspace=api', { cwd: root, stdio: 'pipe', env: process.env });
  } catch (e) {
    console.warn('[e2e] db:push falló (¿Postgres en marcha?).', e.message || e);
  }
  try {
    execSync('npm run db:seed', {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
      env: process.env,
    });
    console.log('[e2e] Seed ejecutado: procesos tipo SERCOP cargados en la BD.');
  } catch (e) {
    console.warn('[e2e] Seed falló (¿BD disponible?). Los tests que requieren procesos pueden omitirse.', e.message || e);
  }
};
