/**
 * Fix App.tsx: remove duplicate imports and broken references
 */
const fs = require('fs');
const filePath = 'c:\\code\\gptSercop\\sercop-unified\\frontend\\src\\App.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1. Remove ALL import lines of deleted banking components and duplicate new imports
const bankingDeleteList = [
  'LCImport', 'LCExport', 'Workbox', 'Guarantee', 'BankAccount',
  'ExchangeRate', 'Commission', 'FinancialInstitution', 'Collection',
  'SwiftField', 'SwiftMessage', 'DynamicSwift', 'GenericProduct',
  'TracerWizard', 'PaymentNotice', 'NonPaymentNotice', 'AcceptanceNotice',
  'AcknowledgmentReceipt', 'ActiveOperations', 'AwaitingResponse',
  'AccountingRules', 'EventRules', 'RegulatoryReporting', 'ReferenceNumberConfig',
  'DocumentManagement', 'Currencies', 'FinancialInstitutions', 'BankAccounts',
];

// Track seen imports to remove duplicates
const seenImports = new Set();
const cleaned = [];
let skipRoute = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Remove broken import lines
  if (trimmed.startsWith('import') && bankingDeleteList.some(k => line.includes(k))) {
    continue;
  }

  // Remove duplicate import lines (same exact line seen before)
  if (trimmed.startsWith('import')) {
    if (seenImports.has(trimmed)) {
      console.log(`  Removed duplicate import at line ${i+1}: ${trimmed.substring(0, 70)}`);
      continue;
    }
    seenImports.add(trimmed);
  }

  // Skip broken route blocks
  if (trimmed.startsWith('<Route') && bankingDeleteList.some(k => line.includes(k))) {
    skipRoute = true;
    continue;
  }
  if (skipRoute) {
    if (line.includes('/>') || line.includes('</Route>')) skipRoute = false;
    continue;
  }

  cleaned.push(line);
}

fs.writeFileSync(filePath, cleaned.join('\n'));
console.log(`App.tsx cleaned. ${lines.length - cleaned.length} lines removed.`);
