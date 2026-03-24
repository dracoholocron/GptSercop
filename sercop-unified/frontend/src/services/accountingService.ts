import type {
  AccountingEntry,
  AccountingRule,
  AccountingConfiguration,
  GenerateEntryRequest,
  AccountingValidationResult
} from '../types/accounting';
import { testAccountingRules } from './accountingRulesService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Servicio para gestionar asientos contables
 * Conecta con el backend que usa Drools para generar asientos automáticos
 */
class AccountingService {
  /**
   * Convierte el resultado del backend a la estructura AccountingEntry
   */
  private convertTestResultToEntry(testResult: any, request: GenerateEntryRequest): AccountingEntry {
    const lines: any[] = [];

    if (testResult.ledgerTable && Array.isArray(testResult.ledgerTable)) {
      testResult.ledgerTable.forEach((ledgerLine: any, index: number) => {
        // Crear línea de débito si existe
        if (ledgerLine.debitAmount && ledgerLine.debitAmount > 0) {
          lines.push({
            lineNumber: lines.length + 1,
            accountCode: ledgerLine.accountNumber,
            accountName: ledgerLine.accountDescription || '',
            movementType: 'DEBIT',
            amount: ledgerLine.debitAmount,
            amountType: 'TOTAL',
            taxable: false
          });
        }

        // Crear línea de crédito si existe
        if (ledgerLine.creditAmount && ledgerLine.creditAmount > 0) {
          lines.push({
            lineNumber: lines.length + 1,
            accountCode: ledgerLine.accountNumber,
            accountName: ledgerLine.accountDescription || '',
            movementType: 'CREDIT',
            amount: ledgerLine.creditAmount,
            amountType: 'TOTAL',
            taxable: false
          });
        }
      });
    }

    return {
      id: undefined,
      date: new Date().toISOString(),
      product: request.product,
      event: request.event,
      reference: request.reference,
      currency: request.currency,
      totalAmount: request.amount,
      lines: lines,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: 'System'
    };
  }

  /**
   * Genera un asiento contable basado en producto y evento
   */
  async generateEntry(request: GenerateEntryRequest): Promise<AccountingEntry> {
    // Usar la función existente testAccountingRules
    const testResult = await testAccountingRules(
      request.product,
      request.event,
      request.amount
    );

    if (!testResult.success) {
      throw new Error(testResult.message || 'Error generating accounting entry');
    }

    return this.convertTestResultToEntry(testResult, request);
  }

  /**
   * Obtiene la configuración contable para un producto y evento
   */
  async getConfiguration(product: string, event: string): Promise<AccountingConfiguration> {
    const response = await fetch(
      `${API_BASE_URL}/api/accounting/configuration?product=${product}&event=${event}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching configuration: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene todas las reglas contables activas
   */
  async getAllRules(): Promise<AccountingRule[]> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/rules`);

    if (!response.ok) {
      throw new Error(`Error fetching rules: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene reglas por producto
   */
  async getRulesByProduct(product: string): Promise<AccountingRule[]> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/rules/product/${product}`);

    if (!response.ok) {
      throw new Error(`Error fetching rules for product: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Valida un asiento contable
   */
  async validateEntry(entry: AccountingEntry): Promise<AccountingValidationResult> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`Error validating entry: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene un asiento por ID
   */
  async getEntryById(id: string): Promise<AccountingEntry> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/${id}`);

    if (!response.ok) {
      throw new Error(`Error fetching entry: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene asientos por referencia (número de operación)
   */
  async getEntriesByReference(reference: string): Promise<AccountingEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/accounting/entries/reference/${reference}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching entries by reference: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Vista previa de un asiento sin guardarlo
   */
  async previewEntry(request: GenerateEntryRequest): Promise<AccountingEntry> {
    // Usar la función existente testAccountingRules
    const testResult = await testAccountingRules(
      request.product,
      request.event,
      request.amount
    );

    if (!testResult.success) {
      throw new Error(testResult.message || 'Error generating accounting preview');
    }

    return this.convertTestResultToEntry(testResult, request);
  }

  /**
   * Contabiliza (post) un asiento
   */
  async postEntry(id: string): Promise<AccountingEntry> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/${id}/post`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Error posting entry: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Reversa un asiento
   */
  async reverseEntry(id: string, reason: string): Promise<AccountingEntry> {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/${id}/reverse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Error reversing entry: ${response.statusText}`);
    }

    return response.json();
  }
}

export const accountingService = new AccountingService();
export default accountingService;
