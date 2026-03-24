/**
 * Limpieza completa de App.tsx: elimina TODOS los imports y routes de módulos bancarios.
 * Reconstruye el archivo desde el original y aplica la purga de forma definitiva.
 */
const fs = require('fs');

// Restore from original  
const source = 'c:\\code\\gptSercop\\compras-publicas-ec\\frontend\\src\\App.tsx';
const dest = 'c:\\code\\gptSercop\\sercop-unified\\frontend\\src\\App.tsx';
fs.copyFileSync(source, dest);
console.log('Restored App.tsx from source');

let content = fs.readFileSync(dest, 'utf8');
const lines = content.split('\n');

// Keywords that identify banking/finance modules to REMOVE
const bankingKeywords = [
  'LCImport', 'LCExport', 'LetterOfCredit', 'CartaCredito',
  'Guarantee', 'Aval', 'BankAccount', 'CuentaBanc',
  'ExchangeRate', 'TipoCambio', 'Currenc', 'Divisa',
  'Commission', 'Comision',
  'FinancialInstitution', 'Institucion',
  'Collection', 'Cobranza',
  'SwiftField', 'DynamicSwift', 'SwiftMessage', 'SwiftTemplate',
  'SwiftMessageCenter', 'SwiftMessageBuilder',
  'GenericProduct', 'TracerWizard',
  'PaymentNotice', 'NonPaymentNotice', 'AcceptanceNotice', 'AcknowledgmentReceipt',
  'ActiveOperations', 'AwaitingResponse',
  'AccountingRules', 'EventRules',
  'RegulatoryReporting', 'ReferenceNumberConfig',
  'DocumentManagement', 'GestionDocumental',
  'Financing', 'Financiamiento', 'TradeFinance',
  'TemplateForm', 'EmailTemplateForm',
  'SwiftFields', 'SwiftAdmin',
  'Workbox', 'WorkboxDraft',
  'Guarantee',
];

const seenImports = new Set();
const cleaned = [];
let skipBlock = false;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Check if this import line references a banking module
  if (trimmed.startsWith('import') && bankingKeywords.some(kw => line.includes(kw))) {
    console.log(`  REMOVED import at line ${i+1}: ${trimmed.substring(0, 80)}`);
    continue;
  }

  // Remove duplicate imports
  if (trimmed.startsWith('import')) {
    if (seenImports.has(trimmed)) {
      console.log(`  DEDUP import at line ${i+1}`);
      continue;
    }
    seenImports.add(trimmed);
  }

  // Check for route blocks with banking elements
  if (trimmed.startsWith('<Route') && bankingKeywords.some(kw => line.includes(kw))) {
    skipBlock = true;
    braceDepth = 0;
    console.log(`  REMOVED route at line ${i+1}: ${trimmed.substring(0, 60)}`);
    // Check if self-closing on same line
    if (line.includes('/>')) { skipBlock = false; }
    continue;
  }

  if (skipBlock) {
    if (line.includes('/>') || line.includes('</Route>')) {
      skipBlock = false;
    }
    continue;
  }

  cleaned.push(line);
}

// Now inject our new routes before </Routes>
const newRoutes = `      <Route path="/cp/infima-cuantia" element={<ProtectedRoute><Dashboard><InfimaCuantiaPage /></Dashboard></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Dashboard><AdvancedSearchPage /></Dashboard></ProtectedRoute>} />`;

const newImports = `import InfimaCuantiaPage from './pages/cp/InfimaCuantiaPage';
import AdvancedSearchPage from './pages/cp/AdvancedSearchPage';`;

let result = cleaned.join('\n');
// Add new imports after last 'import' line near ComprasPublicasExpert
result = result.replace(
  "import { ComprasPublicasExpert } from './pages/ComprasPublicasExpert';",
  `import { ComprasPublicasExpert } from './pages/ComprasPublicasExpert';\n${newImports}`
);
// Add new routes before </Routes>
result = result.replace('</Routes>', `${newRoutes}\n    </Routes>`);

fs.writeFileSync(dest, result);
console.log(`Done! App.tsx now has ${result.split('\n').length} lines`);
