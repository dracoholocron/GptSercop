/**
 * Tipos para Asientos Contables
 * Sistema transversal para generar asientos contables automáticos
 */

export interface AccountingEntry {
  id?: string;
  date: string;
  product: string; // MT700, MT103, MT400, MT760, etc.
  event: string; // EMISSION_LC_IMPORT, PAYMENT_LC_EXPORT, etc.
  reference: string; // Número de operación
  currency: string;
  totalAmount: number;
  lines: AccountingLine[];
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  createdAt?: string;
  createdBy?: string;
}

export interface AccountingLine {
  lineNumber: number;
  accountCode: string;
  accountName: string;
  movementType: 'DEBIT' | 'CREDIT';
  amount: number;
  amountType?: 'TOTAL' | 'COMMISSION' | 'SWIFT_FEE' | 'POSTAGE' | 'VAT';
  taxable?: boolean;
}

export interface AccountingRule {
  ruleName: string;
  product: string;
  event: string;
  debitAccount: string;
  creditAccount: string;
  isActive: boolean;
  lineNumber?: string; // Line1, Line2, etc. for composite entries
  amountType?: string;
  movementType?: 'DEBIT' | 'CREDIT';
  fixedAmount?: number;
  rate?: number;
  taxable?: boolean;
}

export interface AccountingConfiguration {
  product: string;
  event: string;
  rules: AccountingRule[];
}

export interface GenerateEntryRequest {
  product: string;
  event: string;
  amount: number;
  currency: string;
  reference: string;
  customerAccount?: string; // For composite entries
  additionalAmounts?: {
    commission?: number;
    swiftFee?: number;
    postage?: number;
  };
}

export interface AccountingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
