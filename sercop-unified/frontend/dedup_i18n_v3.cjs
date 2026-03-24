/**
 * Solución definitiva para i18n/config.ts.
 * El archivo tiene 2 objetos de idioma (en / es) del legacy que comparten
 * las mismas claves a nivel global. esbuild reporta duplicados porque
 * el archivo exporta UN objeto con dos copias de las mismas secciones.
 * 
 * Estrategia: Detectar el inicio de la SEGUNDA copia del objeto en inglés
 * (que parece que el archivo tiene: { en: {...}, es: {...} } x2) y eliminarla.
 * 
 * Alternativa más simple: leer el archivo, evaluarlo como JS (no, TypeScript), 
 * y simplemente reemplazar claves duplicadas a nivel cosmético dejando solo la primera.
 * 
 * REAL ESTRATEGIA: El error dice que las claves duplicadas están en líneas 4922, 4990, etc.
 * Estas son dentro del BLOQUE DE UN IDIOMA. Significa que DENTRO de la sección de un idioma,
 * hay dos secciones con la misma clave padre.
 * 
 * Vamos a cortar todo el bloque desde la línea 4920 hasta ~5100 que contiene los '41a','53a', etc. duplicados.
 */
const fs = require('fs');
const filePath = 'c:\\code\\gptSercop\\sercop-unified\\frontend\\src\\i18n\\config.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log(`Total lines: ${lines.length}`);

// Find all lines that match the duplicate key patterns reported by esbuild:
// '41a', '53a', '57a', '58a' are Swift field codes that appear twice
// alerts at line 7742 and 10628 (also duplicates)

// Strategy: find and remove the SECOND occurrence of specific patterns
function removeSecondOccurrence(linesArr, pattern, contextLines = 50) {
  let firstFound = -1;
  let count = 0;
  const toRemove = new Set();
  
  for (let i = 0; i < linesArr.length; i++) {
    if (linesArr[i].match(pattern)) {
      count++;
      if (count === 1) {
        firstFound = i;
      } else if (count === 2) {
        // Found second occurrence - need to remove the enclosing block
        // Find start of block (go back to find the parent property)
        let blockStart = i;
        // Find corresponding closing brace by counting braces
        let depth = 0;
        let blockEnd = i;
        for (let j = i; j < linesArr.length; j++) {
          for (const ch of linesArr[j]) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          if (depth <= 0 && j > i) {
            blockEnd = j;
            break;
          }
        }
        console.log(`  Second "${pattern}" at line ${i+1}, block ends at line ${blockEnd+1}`);
        for (let k = blockStart; k <= blockEnd; k++) toRemove.add(k);
      }
    }
  }
  
  return linesArr.filter((_, i) => !toRemove.has(i));
}

// Patterns to deduplicate (second occurrences)
const patterns = [
  /^\s+'41a':\s*\{/,
  /^\s+clientPortal:\s*\{/,
  /^\s+status:\s*\{.*$/,
];

let result = lines;
for (const pattern of patterns) {
  result = removeSecondOccurrence(result, pattern);
  console.log(`After removing second "${pattern}": ${result.length} lines`);
}

// Special: remove the second and third occurrence of "alerts: {" blocks
const alertPatten = /^\s+alerts:\s*\{/;
let alertCount = 0;
let toRemove = new Set();
let i = 0;
while (i < result.length) {
  if (result[i].match(alertPatten)) {
    alertCount++;
    if (alertCount >= 2) {
      // Find end of this alerts block
      let depth = 0;
      let blockEnd = i;
      for (let j = i; j < result.length; j++) {
        for (const ch of result[j]) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        if (depth <= 0 && j > i) { blockEnd = j; break; }
      }
      console.log(`  Removing extra alerts block at line ${i+1} to ${blockEnd+1}`);
      for (let k = i; k <= blockEnd; k++) toRemove.add(k);
      i = blockEnd + 1;
      continue;
    }
  }
  i++;
}
result = result.filter((_, idx) => !toRemove.has(idx));
console.log(`After removing duplicate alerts blocks: ${result.length} lines`);

fs.writeFileSync(filePath, result.join('\n'));
console.log('\nDone! i18n/config.ts deduplicated successfully.');
