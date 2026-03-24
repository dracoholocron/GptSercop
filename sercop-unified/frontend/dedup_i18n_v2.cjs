/**
 * Fix duplicate keys in i18n/config.ts by removing sections with 
 * known duplicate parent keys. Tracks object depth per language section.
 */
const fs = require('fs');
const filePath = 'c:\\code\\gptSercop\\sercop-unified\\frontend\\src\\i18n\\config.ts';
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// We'll find and remove specific duplicate top-level language keys by tracking 
// all lines that match each language object's duplicate key structure.

// Strategy: parse line by line, tracking object depth and key occurrences at each depth level.
// When a duplicate key is found at depth > 0, skip that entire block.

let result = [];
let depth = 0;
let keyTracker = []; // stack of {depth, seenKeys}
let skipUntilDepth = -1; // Set to depth level when we start skipping
let skipping = false;
let skipped = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Count braces
  for (const ch of line) {
    if (ch === '{') {
      depth++;
      // New object opened, push a new tracker scope
      keyTracker.push({ depth, keys: new Set() });
    } else if (ch === '}') {
      // Object closed
      if (skipping && depth === skipUntilDepth) {
        // We finished skipping this block
        skipping = false;
        skipUntilDepth = -1;
        depth--;
        skipped++;
        continue; // Skip the closing brace of the duplicate block too
      }
      // Pop tracker
      if (keyTracker.length > 0 && keyTracker[keyTracker.length - 1].depth === depth) {
        keyTracker.pop();
      }
      depth--;
    }
  }
  
  if (skipping) {
    skipped++;
    continue;
  }
  
  // Check for object key definition
  const keyMatch = trimmed.match(/^['"]?([a-zA-Z0-9_]+)['"]?\s*:\s*\{/);
  if (keyMatch && keyTracker.length >= 2) { // Only check within nested objects  
    const key = keyMatch[1];
    const parentTracker = keyTracker[keyTracker.length - 2]; // parent scope
    
    if (parentTracker.keys.has(key)) {
      // Duplicate found! Skip this entire block.
      skipping = true;
      skipUntilDepth = depth - 1; // Skip until we're back at this depth
      skipped++;
      console.log(`  Skipping duplicate key "${key}" at line ${i + 1} (depth ${depth})`);
      continue;
    } else {
      parentTracker.keys.add(key);
    }
  }
  
  result.push(line);
}

fs.writeFileSync(filePath, result.join('\n'));
console.log(`\nDone! Removed ${skipped} lines containing duplicate keys.`);
