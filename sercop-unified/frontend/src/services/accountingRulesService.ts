import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/api.config';

export interface AccountingRuleTestRequest {
  product: string;
  event: string;
  amount: number;
}

export interface AccountingEntry {
  ruleId: string;
  ruleName: string;
  accountNumber: string;
  accountType: string;
  movementType: string;
  amountType: string;
  fixedAmount?: number;
  variableAmount?: number;
  calculatedAmount: number;
  description?: string;
}

export interface LedgerLine {
  accountNumber: string;
  accountDescription: string;
  debitAmount?: number;
  creditAmount?: number;
}

export interface AccountingRuleTestResult {
  success: boolean;
  message: string;
  totalRulesFired?: number;
  accountingEntries?: AccountingEntry[];
  ledgerTable?: LedgerLine[];
}

/**
 * Test accounting rules with the given parameters
 * Note: DRL content is now stored and read from the backend server
 */
export const testAccountingRules = async (
  product: string,
  event: string,
  amount: number
): Promise<AccountingRuleTestResult> => {
  try {
    // Get authentication token
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make API call - backend will read DRL from file system
    const response = await fetch(`${API_BASE_URL}/v1/catalogs/accounting-rules/test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product,
        event,
        amount,
      } as AccountingRuleTestRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AccountingRuleTestResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error testing accounting rules:', error);
    return {
      success: false,
      message: `Error al ejecutar reglas contables: ${error}`,
    };
  }
};

export const accountingRulesService = {
  testAccountingRules,
};
