import { execSync } from 'child_process';
import fs from 'fs';
try {
  const result = execSync('npx vitest run tests/integration.test.ts --reporter json', { encoding: 'utf8' });
  fs.writeFileSync('result_utf8.json', result);
} catch (e) {
  fs.writeFileSync('result_utf8.json', e.stdout);
}
