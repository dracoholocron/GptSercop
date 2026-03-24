/**
 * Deduplica las llaves del i18n/config.ts.
 * Estrategia: cuando hay llaves duplicadas, mantenemos la PRIMERA y borramos las subsiguientes.
 * Funciona parseando manualmente la estructura de objetos JS.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'i18n', 'config.ts');
let content = fs.readFileSync(filePath, 'utf8');

// We'll use eval-unsafe approach: find duplicate patterns using regex
// Approach: track line numbers of duplicate keys and delete the duplicate key+block
// Simple strategy: for multi-language exports, esbuild just needs unique keys at each object level.

// Actually the simplest fix: parse the content as text, 
// find "Duplicate key" problematic occurrences and neutralize them.
// Build error tells us the problem keys; we'll rename duplicates

const lines = content.split('\n');
const objectKeyStack = []; // Track objects stack
const keysSeen = {}; // Map of "stack_depth_signature" -> Set of keys seen

let depth = 0;
let objectId = 0;
let objectIdStack = [];
const newLines = [];
let duplicateCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Count brace changes to track depth
  for (const ch of line) {
    if (ch === '{') {
      depth++;
      objectId++;
      objectIdStack.push(objectId);
      const sig = objectIdStack.slice(-3).join('_');
      if (!keysSeen[sig]) keysSeen[sig] = new Set();
    } else if (ch === '}') {
      objectIdStack.pop();
      depth--;
    }
  }
  
  // Check if this line has an object key pattern like:   key: or 'key': or "key":
  const keyMatch = line.match(/^\s+['"]?([a-zA-Z0-9_]+)['"]?\s*:/);
  if (keyMatch && depth > 0 && objectIdStack.length > 0) {
    const key = keyMatch[1];
    const parentSig = objectIdStack.slice(0, -1).join('_') + '_' + (objectIdStack[objectIdStack.length-1] || '');
    
    if (!keysSeen[parentSig]) keysSeen[parentSig] = new Set();
    
    if (keysSeen[parentSig].has(key)) {
      // Duplicate - comment it out
      newLines.push(`// DEDUPED: ${line}`);
      duplicateCount++;
      continue;
    } else {
      keysSeen[parentSig].add(key);
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log(`Deduplication complete. ${duplicateCount} duplicate keys commented out from i18n/config.ts`);
