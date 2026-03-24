/**
 * GLE Service - General Ledger Entries
 * Servicio para consultar asientos contables del libro mayor
 */

import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/api.config';
import { GLE_ROUTES, buildUrlWithParams } from '../config/api.routes';

export interface GleEntry {
  id: number;
  inr: string;
  objtyp: string;
  objinr: string;
  trninr: string;
  act: string;
  dbtcdt: 'D' | 'C';
  cur: string;
  amt: number;
  syscur: string;
  sysamt: number;
  valdat: string;
  bucdat: string;
  txt1: string;
  txt2: string;
  txt3: string;
  prn: string;
  expses: string;
  tsyref: string;
  expflg: string;
  acttyp: string;
}

export interface GleSummary {
  totalEntries: number;
  totals: {
    debits: { total: number; count: number };
    credits: { total: number; count: number };
  };
  byCurrency: Array<{
    currency: string;
    type: 'debit' | 'credit';
    total: number;
    count: number;
  }>;
}

export interface GleAIStats {
  totalEntries: number;
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  byCurrency: Record<string, {
    debits?: number;
    credits?: number;
    debitCount?: number;
    creditCount?: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    type: string;
    currency: string;
    total: number;
    count: number;
  }>;
}

export interface GleMonthlyData {
  month: string;
  type: 'debit' | 'credit';
  currency: string;
  total: number;
  count: number;
}

export interface GleAccountData {
  account: string;
  type: 'debit' | 'credit';
  currency: string;
  total: number;
}

export interface GleBalanceEntry {
  id: number;
  account: string;
  type: 'D' | 'C';
  currency: string;
  amount: number;
  valueDate: string;
  description: string;
  description2: string;
}

export interface GleCurrencyBalance {
  currency: string;
  debits: number;
  credits: number;
  debitCount: number;
  creditCount: number;
  netBalance: number;
}

export interface GleOperationBalance {
  reference: string;
  totalEntries: number;
  found: boolean;
  message?: string;
  byCurrency?: GleCurrencyBalance[];
  entries?: GleBalanceEntry[];
}

export interface GleAccountBalance {
  currency: string;
  account: string;
  debits: number;
  credits: number;
  balance: number;
  operationCount: number;
  productType: string;
}

export interface GleCurrencySummary {
  currency: string;
  debits: number;
  credits: number;
  balance: number;
}

export interface GleGlobalAccountReport {
  accounts: GleAccountBalance[];
  totalAccounts: number;
  byCurrency: GleCurrencySummary[];
  totalDebits: number;
  totalCredits: number;
  totalBalance: number;
}

export interface GleCommissionEntry {
  account: string;
  transactionId: string;
  accountDisplay: string;
  type: 'D' | 'C';
  currency: string;
  amount: number;
  reference: string;
  activityType: string;
  createdAt: string;
  productType: string;
}

export interface GleCommissionByCurrency {
  currency: string;
  debits: number;
  credits: number;
  count: number;
}

export interface GleCommissionByReference {
  reference: string;
  currency: string;
  amount: number;
  productType: string;
}

export interface GleCommissionByProductType {
  productType: string;
  currency: string;
  amount: number;
  count: number;
}

export interface GleCommissionByMonth {
  month: string;  // YYYY-MM format
  amount: number;
  count: number;
}

export interface GleCommissionsReport {
  entries: GleCommissionEntry[];
  totalEntries: number;
  totalEntriesReal?: number;
  byCurrency: GleCommissionByCurrency[];
  byReference: GleCommissionByReference[];
  byProductType: GleCommissionByProductType[];
  byMonth?: GleCommissionByMonth[];
  totalCommissions: number;
  startDate?: string;
  endDate?: string;
  availableAccounts?: AvailableAccount[];
}

export interface CommissionsFilter {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  months?: number;     // Default 3
  accounts?: string[]; // Filtro por cuentas contables específicas
}

export interface AvailableAccount {
  account: string;
  count: number;
  total: number;
}

export interface GleAccountTransaction {
  reference: string;
  type: 'D' | 'C';
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  bookingDate: string;
  valueDate: string;
  description: string;
  description2: string;
  transactionCount: number;
}

// ============================================================================
// COMISIONES PENDIENTES (cuentas 71% y 72%)
// ============================================================================

export interface PendingCommissionByCurrency {
  currency: string;
  debits: number;
  credits: number;
  balance: number;
  operationCount: number;
}

export interface PendingCommissionByProductType {
  productType: string;
  currency: string;
  debits: number;
  credits: number;
  balance: number;
  count: number;
}

export interface PendingCommissionOperation {
  reference: string;
  currency: string;
  debits: number;
  credits: number;
  balance: number;
  productType: string;
  lastDate: string;
}

export interface PendingCommissionsReport {
  totalPending: number;
  totalOperations: number;
  byCurrency: PendingCommissionByCurrency[];
  byProductType: PendingCommissionByProductType[];
  operations: PendingCommissionOperation[];
  availableAccounts: AvailableAccount[];
}

export interface GleAccountTransactionsReport {
  account: string;
  currency: string;
  transactions: GleAccountTransaction[];
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  balance: number;
  // Pagination
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

class GleService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  /**
   * Obtiene resumen general del libro mayor
   */
  async getSummary(): Promise<GleSummary> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.SUMMARY}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching GLE summary');
    return response.json();
  }

  /**
   * Obtiene estadísticas para el dashboard de IA
   */
  async getAIStats(): Promise<GleAIStats> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.AI_STATS}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching GLE AI stats');
    return response.json();
  }

  /**
   * Obtiene resumen mensual
   */
  async getMonthlySummary(): Promise<GleMonthlyData[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.MONTHLY}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching monthly summary');
    return response.json();
  }

  /**
   * Obtiene resumen por cuenta
   */
  async getByAccount(): Promise<GleAccountData[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BY_ACCOUNT}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching account summary');
    return response.json();
  }

  /**
   * Obtiene las últimas entradas
   */
  async getRecentEntries(): Promise<GleEntry[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.RECENT}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching recent entries');
    return response.json();
  }

  /**
   * Busca entradas por texto
   */
  async searchByText(text: string): Promise<GleEntry[]> {
    const url = buildUrlWithParams(GLE_ROUTES.SEARCH, { text });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error searching GLE entries');
    return response.json();
  }

  /**
   * Obtiene entradas por cuenta (contiene)
   */
  async getByAccountNumber(account: string): Promise<GleEntry[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BY_ACCOUNT_NUMBER(account)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching account entries');
    return response.json();
  }

  /**
   * Obtiene entradas por cuenta que inicie con prefijo
   */
  async getByAccountPrefix(prefix: string): Promise<GleEntry[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BY_ACCOUNT_PREFIX(prefix)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching account entries by prefix');
    return response.json();
  }

  /**
   * Obtiene entradas por moneda
   */
  async getByCurrency(currency: string): Promise<GleEntry[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BY_CURRENCY(currency)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching currency entries');
    return response.json();
  }

  /**
   * Obtiene entradas por rango de fechas
   */
  async getByDateRange(start: Date, end: Date): Promise<GleEntry[]> {
    const url = buildUrlWithParams(GLE_ROUTES.BY_DATE_RANGE, {
      start: start.toISOString(),
      end: end.toISOString(),
    });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching date range entries');
    return response.json();
  }

  /**
   * Obtiene entradas por referencia de operación
   */
  async getByReference(reference: string): Promise<GleEntry[]> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BY_REFERENCE(reference)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching reference entries');
    return response.json();
  }

  /**
   * Busca entradas por referencia (búsqueda parcial)
   */
  async searchByReference(reference: string): Promise<GleEntry[]> {
    const url = buildUrlWithParams(GLE_ROUTES.SEARCH_REFERENCE, { reference });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error searching by reference');
    return response.json();
  }

  /**
   * Obtiene el balance contable de una operación por referencia
   */
  async getOperationBalance(reference: string): Promise<GleOperationBalance> {
    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.BALANCE(reference)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching operation balance');
    return response.json();
  }

  /**
   * Obtiene el informe global por cuenta contable
   * Análisis financiero: agrupa por moneda y cuenta, calcula débitos, créditos y saldo
   * @param positiveOnly - Si true, solo muestra cuentas con saldo positivo (débitos > créditos)
   */
  async getGlobalAccountReport(positiveOnly: boolean = true): Promise<GleGlobalAccountReport> {
    const url = buildUrlWithParams(GLE_ROUTES.GLOBAL_ACCOUNT_REPORT, { positiveOnly });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching global account report');
    return response.json();
  }

  /**
   * Obtiene las comisiones cobradas al cliente
   * Busca asientos donde acttyp = 'LO' (comisiones) y prn = 36
   * @param filter - Filtro opcional con fechas, número de meses o cuentas específicas
   */
  async getCommissionsCharged(filter?: CommissionsFilter): Promise<GleCommissionsReport> {
    const params: Record<string, any> = {};
    if (filter?.startDate) params.startDate = filter.startDate;
    if (filter?.endDate) params.endDate = filter.endDate;
    if (filter?.months !== undefined && filter?.months !== null) params.months = filter.months;
    if (filter?.accounts && filter.accounts.length > 0) params.accounts = filter.accounts;

    const url = buildUrlWithParams(GLE_ROUTES.COMMISSIONS, params);

    console.log('[GLE] Commissions filter:', filter);
    console.log('[GLE] Commissions URL:', `${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Error fetching commissions charged');
    return response.json();
  }

  /**
   * Obtiene las comisiones PENDIENTES de cobro
   * Busca asientos en cuentas 71% y 72% (provisiones y comisiones por cobrar)
   * Agrupa por referencia y muestra saldo pendiente
   */
  async getPendingCommissions(): Promise<PendingCommissionsReport> {
    console.log('[GLE] Pending Commissions URL:', `${API_BASE_URL}${GLE_ROUTES.COMMISSIONS_PENDING}`);

    const response = await fetch(`${API_BASE_URL}${GLE_ROUTES.COMMISSIONS_PENDING}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching pending commissions');
    return response.json();
  }

  /**
   * Obtiene las transacciones detalladas de una cuenta específica
   * Para drill-down desde el informe global por cuenta
   * @param account - Número de cuenta contable
   * @param currency - Código de moneda
   * @param page - Número de página (0-indexed)
   * @param size - Tamaño de página
   */
  async getAccountTransactions(
    account: string,
    currency: string,
    page: number = 0,
    size: number = 50
  ): Promise<GleAccountTransactionsReport> {
    const url = buildUrlWithParams(GLE_ROUTES.ACCOUNT_TRANSACTIONS, { account, currency, page, size });
    const response = await fetch(`${API_BASE_URL}${url}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Error fetching account transactions');
    return response.json();
  }
}

export const gleService = new GleService();
export default gleService;
