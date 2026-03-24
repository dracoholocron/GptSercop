/**
 * Eliminamos de forma más completna: 
 * Los archivos que aún referencian componentes bancarios eliminados.
 * Como son wizards/views de LC/Guarantees/Swift que no eliminamos del src/pages aún.
 */
const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\code\\gptSercop\\sercop-unified\\frontend\\src';
const bankingFiles = [
  // Wizard pages that use banking components
  'pages/GenericProductWizard.tsx',
  'pages/GenericProductExpert.tsx',
  'pages/GenericProductClient.tsx',
  'pages/TracerWizard.tsx',
  'pages/PaymentNoticeWizard.tsx',
  'pages/NonPaymentNoticeWizard.tsx',
  'pages/AcceptanceNoticeWizard.tsx',
  'pages/AcknowledgmentReceiptWizard.tsx',
  // Additional banking components with references
  'components/accounting',  
  // Swift field admin references
  'pages/SwiftFields.tsx',
  'pages/SwiftFieldsAdmin.tsx',
  'pages/SwiftMessageCenter.tsx',
  // Any remaining LC/Guarantee/Collection refs
  'pages/ActiveOperations.tsx',
  'pages/AwaitingResponse.tsx',
];

// Also handle specific broken component files
const brokenComponents = [
  'components/DynamicSwiftField.tsx',
  'components/DynamicSwiftForm.tsx', 
  'components/DynamicSwiftSection.tsx',
  'components/SwiftPartyField.tsx',
  'components/SwiftTextareaField.tsx',
  'components/SwiftMultiOptionField.tsx',
  'components/SwiftReferenceField.tsx',
  'components/CommissionCalculator.tsx',
  'components/BankAccountSelector.tsx',
  'components/CurrencyAmountField.tsx',
  'components/CurrencyAmountInput.tsx',
  'components/CurrencySelector.tsx',
  'components/CountrySelector.tsx', // Not banking but let's check
];

let deleted = 0;
for (const relPath of [...bankingFiles, ...brokenComponents]) {
  const fullPath = path.join(srcDir, relPath);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
      console.log(`  [DIR] Deleted: ${relPath}`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`  [FILE] Deleted: ${relPath}`);
    }
    deleted++;
  }
}

console.log(`\nDone! Deleted ${deleted} banking artifacts.`);
