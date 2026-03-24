#!/usr/bin/env node
/**
 * Script to extract SWIFT field documentation from SRG (Standards Release Guide) HTML files
 * and generate i18n helpText entries.
 *
 * Usage: node extract-swift-help.js <srg-folder> <message-type>
 * Example: node extract-swift-help.js /Users/cesaralvarez/Downloads/srg2026 MT760
 */

const fs = require('fs');
const path = require('path');

// Map message types to their SRG folder prefixes
// Category 4: Collections and Cash Letters
// Category 7: Documentary Credits and Guarantees/Standby Letters of Credit
const MESSAGE_TYPE_MAP = {
  // Category 4 - Collections
  // Note: MT400, MT410, MT412, MT422 don't have field files in SRG 2024-2026 (unchanged message types)
  'MT400': { folder: 'us4m', prefix: 'adcf', name: 'Advice of Payment' },
  'MT410': { folder: 'us4m', prefix: 'addf', name: 'Acknowledgement' },
  'MT412': { folder: 'us4m', prefix: 'adef', name: 'Advice of Acceptance' },
  'MT416': { folder: 'us4m', prefix: 'adff', name: 'Advice of Non-Payment/Non-Acceptance' },
  'MT420': { folder: 'us4m', prefix: 'adgg', name: 'Tracer' },
  'MT422': { folder: 'us4m', prefix: 'adhf', name: 'Advice of Fate and Request for Instructions' },
  'MT430': { folder: 'us4m', prefix: 'adig', name: 'Amendment of Instructions' },

  // Category 4 - Cash Letters
  // Note: MT450, MT455, MT456 don't have field files in SRG 2024-2026 (unchanged message types)
  'MT450': { folder: 'us4m', prefix: 'aecf', name: 'Cash Letter Credit Advice' },
  'MT455': { folder: 'us4m', prefix: 'aedf', name: 'Cash Letter Credit Adjustment Advice' },
  'MT456': { folder: 'us4m', prefix: 'aeef', name: 'Advice of Dishonour' },

  // Category 4 - Common Group
  // Note: MT490-MT499 don't have field files in SRG 2024-2026 (unchanged message types)
  'MT490': { folder: 'us4m', prefix: 'afcf', name: 'Advice of Charges, Interest and Other Adjustments' },
  'MT491': { folder: 'us4m', prefix: 'afdf', name: 'Request for Payment of Charges, Interest and Other Expenses' },
  'MT492': { folder: 'us4m', prefix: 'afef', name: 'Request for Cancellation' },
  'MT495': { folder: 'us4m', prefix: 'afff', name: 'Queries' },
  'MT496': { folder: 'us4m', prefix: 'afgf', name: 'Answers' },
  'MT498': { folder: 'us4m', prefix: 'afhf', name: 'Proprietary Message' },
  'MT499': { folder: 'us4m', prefix: 'afif', name: 'Free Format Message' },

  // Category 7 - Documentary Credits
  'MT700': { folder: 'us7m', prefix: 'adcg', name: 'Issue of a Documentary Credit' },
  'MT701': { folder: 'us7m', prefix: 'addg', name: 'Issue of a Documentary Credit' },
  'MT705': { folder: 'us7m', prefix: 'adeg', name: 'Pre-Advice of a Documentary Credit' },
  'MT707': { folder: 'us7m', prefix: 'adfg', name: 'Amendment to a Documentary Credit' },
  'MT708': { folder: 'us7m', prefix: 'adgg', name: 'Acknowledgement of Amendment' },
  'MT710': { folder: 'us7m', prefix: 'adhg', name: 'Advice of a Third Bank Documentary Credit' },
  'MT711': { folder: 'us7m', prefix: 'adig', name: 'Advice of a Third Bank Documentary Credit' },
  'MT720': { folder: 'us7m', prefix: 'adjg', name: 'Transfer of a Documentary Credit' },
  'MT721': { folder: 'us7m', prefix: 'adkg', name: 'Transfer of a Documentary Credit' },
  'MT730': { folder: 'us7m', prefix: 'adlg', name: 'Acknowledgement' },
  'MT732': { folder: 'us7m', prefix: 'admg', name: 'Advice of Discharge' },
  'MT734': { folder: 'us7m', prefix: 'adng', name: 'Advice of Refusal' },
  'MT740': { folder: 'us7m', prefix: 'adog', name: 'Authorisation to Reimburse' },
  'MT742': { folder: 'us7m', prefix: 'adpg', name: 'Reimbursement Claim' },
  'MT744': { folder: 'us7m', prefix: 'adqg', name: 'Advice of Authorisation to Reimburse' },
  'MT747': { folder: 'us7m', prefix: 'adrg', name: 'Amendment to Authorisation to Reimburse' },
  'MT750': { folder: 'us7m', prefix: 'adsg', name: 'Advice of Discrepancy' },
  'MT752': { folder: 'us7m', prefix: 'adtg', name: 'Authorisation to Pay, Accept or Negotiate' },
  'MT754': { folder: 'us7m', prefix: 'adug', name: 'Advice of Payment/Acceptance/Negotiation' },
  'MT756': { folder: 'us7m', prefix: 'advg', name: 'Advice of Reimbursement or Payment' },
  'MT759': { folder: 'us7m', prefix: 'adwg', name: 'Ancillary Trade Structured Message' },

  // Guarantees/Standby Letters of Credit
  'MT760': { folder: 'us7m', prefix: 'afcg', name: 'Guarantee / Standby Letter of Credit' },
  'MT761': { folder: 'us7m', prefix: 'afdg', name: 'Guarantee / Standby Letter of Credit' },
  'MT765': { folder: 'us7m', prefix: 'afeg', name: 'Guarantee / Standby LC Amendment' },
  'MT767': { folder: 'us7m', prefix: 'affg', name: 'Guarantee / Standby LC Amendment' },
  'MT768': { folder: 'us7m', prefix: 'afgg', name: 'Acknowledgement of Guarantee / Standby LC Message' },
  'MT769': { folder: 'us7m', prefix: 'afhg', name: 'Advice of Reduction / Release' },
  'MT775': { folder: 'us7m', prefix: 'afig', name: 'Advice of Claim Payment' },
  'MT785': { folder: 'us7m', prefix: 'afjg', name: 'Advice of Expiration' },
  'MT786': { folder: 'us7m', prefix: 'afkg', name: 'Request for Amendment' },
  'MT787': { folder: 'us7m', prefix: 'aflg', name: 'Request for Issuance' },

  // Common to Several Instruments
  'MT790': { folder: 'us7m', prefix: 'aecg', name: 'Advice of Charges, Interest and Other Adjustments' },
  'MT791': { folder: 'us7m', prefix: 'aedg', name: 'Request for Payment of Charges, Costs and/or Interest' },
  'MT792': { folder: 'us7m', prefix: 'aeeg', name: 'Request for Cancellation' },
  'MT795': { folder: 'us7m', prefix: 'aefg', name: 'Queries' },
  'MT796': { folder: 'us7m', prefix: 'aegg', name: 'Answers' },
  'MT799': { folder: 'us7m', prefix: 'aehg', name: 'Free Format Message' },
};

function extractTextFromHtml(html, startTag, endTags) {
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) return null;

  let endIndex = html.length;
  for (const endTag of endTags) {
    const idx = html.indexOf(endTag, startIndex + startTag.length);
    if (idx !== -1 && idx < endIndex) {
      endIndex = idx;
    }
  }

  let text = html.substring(startIndex + startTag.length, endIndex);

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&#160;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

function parseFieldFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');

  // Extract field code from title
  const titleMatch = html.match(/Field\s+([0-9A-Za-z]+):\s*([^<]+)/);
  if (!titleMatch) return null;

  const fieldCode = titleMatch[1];
  const fieldName = titleMatch[2].trim();

  // Extract FORMAT
  const format = extractTextFromHtml(html, '<h4 class="fldfmt">FORMAT</h4>', ['<h4 class="fldprsnc">', '<h4 class="flddef">', '</body>']);

  // Extract PRESENCE
  const presence = extractTextFromHtml(html, '<h4 class="fldprsnc">PRESENCE</h4>', ['<h4 class="flddef">', '<h4 class="fldusgrls">', '<h4 class="fldvalrls">', '</body>']);

  // Extract DEFINITION
  const definition = extractTextFromHtml(html, '<h4 class="flddef">DEFINITION</h4>', ['<h4 class="fldusgrls">', '<h4 class="fldvalrls">', '<div class="noprint">', '</body>']);

  // Extract NETWORK VALIDATED RULES or USAGE RULES
  let rules = extractTextFromHtml(html, '<h4 class="fldvalrls">NETWORK VALIDATED RULES</h4>', ['<div class="noprint">', '</body>']);
  if (!rules) {
    rules = extractTextFromHtml(html, '<h4 class="fldusgrls">USAGE RULES</h4>', ['<div class="noprint">', '</body>']);
  }

  return {
    fieldCode: `:${fieldCode}:`,
    fieldCodeClean: fieldCode,
    fieldName,
    format: format || '',
    presence: presence || '',
    definition: definition || '',
    rules: rules || ''
  };
}

function generateHelpText(field) {
  const parts = [];

  if (field.definition) {
    parts.push(field.definition);
  }

  if (field.rules) {
    parts.push(`Validation: ${field.rules}`);
  }

  if (field.format) {
    parts.push(`Format: ${field.format}`);
  }

  return parts.join(' | ');
}

function processMessageType(srgFolder, messageType, outputFormat = 'i18n') {
  const config = MESSAGE_TYPE_MAP[messageType.toUpperCase()];

  if (!config) {
    console.error(`Unknown message type: ${messageType}`);
    return null;
  }

  const folderPath = path.join(srgFolder, 'books', config.folder);

  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    return null;
  }

  // Find all field files
  const files = fs.readdirSync(folderPath)
    .filter(f => f.startsWith(config.prefix) && f.endsWith('.htm'))
    .sort();

  const fields = [];
  const seenFieldCodes = new Set();

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const field = parseFieldFile(filePath);

    if (field) {
      // Skip duplicate field codes (same field can appear in different sequences A, B, etc.)
      if (seenFieldCodes.has(field.fieldCodeClean)) {
        continue;
      }
      seenFieldCodes.add(field.fieldCodeClean);
      fields.push(field);
    }
  }

  return { messageType, config, fields };
}

function outputI18n(results) {
  console.log('// SWIFT Field Documentation from Official SRG');
  console.log('// Auto-generated by extract-swift-help.js');
  console.log('// Copy this into your i18n config.ts file\n');

  console.log('swift: {');

  for (const result of results) {
    if (!result || result.fields.length === 0) continue;

    console.log(`  // ${result.messageType} - ${result.config.name}`);
    console.log(`  ${result.messageType.toLowerCase()}: {`);

    for (const field of result.fields) {
      const helpText = generateHelpText(field);

      console.log(`    '${field.fieldCodeClean}': {`);
      console.log(`      fieldName: '${escapeString(field.fieldName)}',`);
      console.log(`      description: '${escapeString(field.definition)}',`);
      console.log(`      placeholder: '',`);
      console.log(`      helpText: '${escapeString(helpText)}'`);
      console.log(`    },`);
    }

    console.log(`  },\n`);
  }

  console.log('}');
}

function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node extract-swift-help.js <srg-folder> <message-type|all>');
    console.log('\nExamples:');
    console.log('  node extract-swift-help.js /Users/cesaralvarez/Downloads/srg2026 MT760');
    console.log('  node extract-swift-help.js /Users/cesaralvarez/Downloads/srg2026 all');
    console.log('\nSupported message types:', Object.keys(MESSAGE_TYPE_MAP).join(', '));
    console.log('\nUse "all" to extract documentation for all supported message types.');
    process.exit(1);
  }

  const [srgFolder, messageType] = args;

  if (messageType.toLowerCase() === 'all') {
    // Process all message types
    const results = [];

    for (const mt of Object.keys(MESSAGE_TYPE_MAP)) {
      console.error(`Processing ${mt}...`);
      const result = processMessageType(srgFolder, mt);
      if (result) {
        results.push(result);
      }
    }

    outputI18n(results);

    // Summary to stderr
    console.error('\n=== Summary ===');
    for (const result of results) {
      if (result) {
        console.error(`${result.messageType}: ${result.fields.length} fields`);
      }
    }
  } else {
    // Process single message type
    const config = MESSAGE_TYPE_MAP[messageType.toUpperCase()];

    if (!config) {
      console.error(`Unknown message type: ${messageType}`);
      console.log('Supported:', Object.keys(MESSAGE_TYPE_MAP).join(', '));
      process.exit(1);
    }

    const result = processMessageType(srgFolder, messageType);

    if (result) {
      outputI18n([result]);

      console.error(`\n// Summary: ${result.fields.length} fields extracted for ${messageType}`);
      console.error('// Fields:', result.fields.map(f => f.fieldCodeClean).join(', '));
    }
  }
}

main();
