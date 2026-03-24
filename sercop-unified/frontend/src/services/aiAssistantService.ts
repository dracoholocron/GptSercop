/**
 * AI Assistant Service - MVP
 *
 * Interpreta prompts del usuario y genera consultas/visualizaciones.
 * MVP usa pattern matching; se puede upgrade a Ollama después.
 */

import i18next from 'i18next';
import { operationsApi, swiftMessagesApi } from './operationsApi';
import { gleService } from './gleService';
import { productTypeConfigService, type ProductTypeConfig } from './productTypeConfigService';
import type { Operation, SwiftMessage } from '../types/operations';

// Traducciones del asistente IA
const translations = {
  en: {
    // Contabilidad
    accountingSummary: 'Accounting summary: {{count}} entries in the general ledger',
    accountingIndicators: 'Accounting Indicators',
    totalEntries: 'Total Entries',
    totalDebits: 'Total Debits',
    totalCredits: 'Total Credits',
    debitsVsCredits: 'Debits vs Credits by Currency',
    monthlyTrend: 'Monthly Movement Trend',
    showLastEntries: 'Show last entries',
    accountBalance: 'Account balance',
    monthlyMovements: 'Monthly movements',
    balanceByCurrency: 'Balance by currency',
    accountingError: 'Could not get accounting information. Verify the service is available.',
    accountingServiceError: 'Could not connect to accounting service',
    generalStats: 'General statistics',
    activeOperations: 'Active operations',
    // Balance de cuenta
    noMovementsFound: 'No movements found for account {{account}}',
    accountNoMovements: 'Account {{account}} has no recorded movements.',
    recentEntries: 'Recent entries',
    accountMovements: 'Account {{account}}: {{count}} movements',
    accountBalanceTitle: 'Account Balance {{account}}',
    debits: 'Debits',
    credits: 'Credits',
    balance: 'Balance',
    movements: 'Movements',
    lastMovements: 'Last Movements',
    date: 'Date',
    type: 'Type',
    debit: 'Debit',
    credit: 'Credit',
    currency: 'Currency',
    amount: 'Amount',
    description: 'Description',
    reference: 'Reference',
    generalAccountingSummary: 'General accounting summary',
    movementsByCurrency: 'Movements by currency',
    accountsSummary: 'Accounts summary',
    balanceByAccount: 'Balance by Account',
    account: 'Account',
    accountBalanceError: 'Error fetching account balance',
    accountInfoError: 'Could not get account information',
    // Informe global por cuenta
    globalAccountReport: 'Global Account Report',
    globalAccountSummary: 'Global summary: {{count}} accounts with activity',
    topAccountsByBalance: 'Top Accounts by Balance',
    distributionByCurrency: 'Distribution by Currency',
    accountBalanceDetails: 'Account Balance Details',
    accountsCount: 'Accounts',
    operationsCount: 'Operations',
    productType: 'Product Type',
    globalAccountExample: 'Global report by accounting account',
    // Comisiones cobradas
    commissionsCharged: 'Commissions Charged',
    commissionsChargedDesc: 'Analyze commissions charged to clients',
    commissionsTitle: 'Client Commissions',
    commissionsTotal: 'Total Commissions',
    commissionsByOperation: 'Commissions by Operation',
    commissionsByCurrency: 'Commissions by Currency',
    commissionsByProduct: 'Commissions by Product',
    commissionsNoData: 'No commission records found',
    commissionsExample: 'Show commissions charged to clients',
    commissionsCount: 'Transactions',
    // Sugerencias generales
    suggestions: 'Suggestions',
    canHelpWith: 'I can help you with:',
    expiringOperations: 'Expiring operations',
    expiringOpsExample: 'Show operations expiring this week',
    amountsSummary: 'Amounts summary',
    amountsSummaryExample: 'How much money do we have in active LCs?',
    monthlyComparison: 'Monthly comparison',
    monthlyCompExample: 'Compare volume month by month',
    statistics: 'Statistics',
    statsExample: 'Show general dashboard',
    byType: 'By type',
    byTypeExample: 'Analyze operations by product type',
    listings: 'Listings',
    listingsExample: 'List operations with amount greater than 100,000',
    swiftMessages: 'SWIFT Messages',
    swiftExample: 'Analyze SWIFT messages',
    swiftSearch: 'Search in SWIFT',
    swiftSearchExample: 'Search text in SWIFT messages',
    swiftSearchResults: 'Found {{count}} messages containing "{{text}}"',
    swiftSearchNoResults: 'No messages found containing "{{text}}"',
    swiftSearchPrompt: 'Please specify what text to search for. Example: "search in swift BENEFICIARY"',
    messageContent: 'Content',
    messageType: 'Type',
    sender: 'Sender',
    receiver: 'Receiver',
    alerts: 'Alerts',
    alertsExample: 'Show system alerts',
    accounting: 'Accounting',
    accountingExample: 'Accounting summary or Account 1101 balance',
    // Saldo por referencia de operación
    operationBalance: 'Operation Accounting Balance',
    operationBalanceFor: 'Accounting balance for operation {{reference}}',
    operationNotFound: 'No accounting entries found for operation {{reference}}',
    operationNoEntries: 'Operation {{reference}} has no accounting entries in the general ledger.',
    operationEntries: 'Operation {{reference}}: {{count}} accounting entries',
    netBalance: 'Net Balance',
    entriesCount: 'Entries',
    sampleEntries: 'Sample Entries',
    valueDate: 'Value Date',
    operationBalanceExample: 'Accounting balance for operation B145061',
    balanceTimeline: 'Balance Timeline by Account',
    // Meses
    monthJan: 'Jan', monthFeb: 'Feb', monthMar: 'Mar', monthApr: 'Apr',
    monthMay: 'May', monthJun: 'Jun', monthJul: 'Jul', monthAug: 'Aug',
    monthSep: 'Sep', monthOct: 'Oct', monthNov: 'Nov', monthDec: 'Dec',
    // Tipos de producto (con prefijo de referencia)
    productType_LC_IMPORT: 'LC Import (I*)',
    productType_LC_EXPORT: 'LC Export (L*)',
    productType_GUARANTEE: 'Guarantee (A*)',
    productType_GUARANTEE_ISSUED: 'Issued Guarantee (B*)',
    productType_GUARANTEE_RECEIVED: 'Received Guarantee (J*)',
    productType_AVAL: 'Bank Aval (K*)',
    productType_STANDBY_LC: 'Standby LC (S*)',
    productType_COLLECTION_IMPORT: 'Import Collection (IE*)',
    productType_COLLECTION_EXPORT: 'Export Collection (E*, G*)',
    productType_COLLECTION: 'Collection',
    productType_FREE_MESSAGE: 'Free Message',
    productType_TRANSFERABLE_LC: 'Transferable LC',
    productType_BACK_TO_BACK_LC: 'Back-to-Back LC',
    productType_LC_AMENDMENT: 'LC Amendment',
  },
  es: {
    // Contabilidad
    accountingSummary: 'Resumen contable: {{count}} asientos en el libro mayor',
    accountingIndicators: 'Indicadores Contables',
    totalEntries: 'Total Asientos',
    totalDebits: 'Total Débitos',
    totalCredits: 'Total Créditos',
    debitsVsCredits: 'Débitos vs Créditos por Moneda',
    monthlyTrend: 'Tendencia Mensual de Movimientos',
    showLastEntries: 'Mostrar últimos asientos',
    accountBalance: 'Saldo de cuenta',
    monthlyMovements: 'Movimientos del mes',
    balanceByCurrency: 'Balance por moneda',
    accountingError: 'No se pudo obtener la información contable. Verifica que el servicio esté disponible.',
    accountingServiceError: 'No se pudo conectar con el servicio de contabilidad',
    generalStats: 'Estadísticas generales',
    activeOperations: 'Operaciones activas',
    // Balance de cuenta
    noMovementsFound: 'No se encontraron movimientos para la cuenta {{account}}',
    accountNoMovements: 'La cuenta {{account}} no tiene movimientos registrados.',
    recentEntries: 'Últimos asientos',
    accountMovements: 'Cuenta {{account}}: {{count}} movimientos',
    accountBalanceTitle: 'Balance de Cuenta {{account}}',
    debits: 'Débitos',
    credits: 'Créditos',
    balance: 'Saldo',
    movements: 'Movimientos',
    lastMovements: 'Últimos Movimientos',
    date: 'Fecha',
    type: 'Tipo',
    debit: 'Débito',
    credit: 'Crédito',
    currency: 'Moneda',
    amount: 'Monto',
    description: 'Descripción',
    reference: 'Referencia',
    generalAccountingSummary: 'Resumen contable general',
    movementsByCurrency: 'Movimientos por moneda',
    accountsSummary: 'Resumen de cuentas contables',
    balanceByAccount: 'Balance por Cuenta',
    account: 'Cuenta',
    accountBalanceError: 'Error al consultar el balance de cuenta',
    accountInfoError: 'No se pudo obtener la información de la cuenta',
    // Informe global por cuenta
    globalAccountReport: 'Informe Global por Cuenta',
    globalAccountSummary: 'Resumen global: {{count}} cuentas con actividad',
    topAccountsByBalance: 'Top Cuentas por Saldo',
    distributionByCurrency: 'Distribución por Moneda',
    accountBalanceDetails: 'Detalle de Saldos por Cuenta',
    accountsCount: 'Cuentas',
    operationsCount: 'Operaciones',
    productType: 'Tipo Producto',
    globalAccountExample: 'Informe global por cuenta contable',
    // Comisiones cobradas
    commissionsCharged: 'Comisiones Cobradas',
    commissionsChargedDesc: 'Analiza las comisiones cobradas a clientes',
    commissionsTitle: 'Comisiones a Clientes',
    commissionsTotal: 'Total Comisiones',
    commissionsByOperation: 'Comisiones por Operación',
    commissionsByCurrency: 'Comisiones por Moneda',
    commissionsByProduct: 'Comisiones por Producto',
    commissionsNoData: 'No se encontraron registros de comisiones',
    commissionsExample: 'Muestra las comisiones cobradas a clientes',
    commissionsCount: 'Transacciones',
    // Sugerencias generales
    suggestions: 'Sugerencias',
    canHelpWith: 'Puedo ayudarte con:',
    expiringOperations: 'Operaciones por vencer',
    expiringOpsExample: 'Muestra operaciones que vencen esta semana',
    amountsSummary: 'Resumen de montos',
    amountsSummaryExample: '¿Cuánto dinero tenemos en LCs activas?',
    monthlyComparison: 'Comparación mensual',
    monthlyCompExample: 'Compara el volumen mes a mes',
    statistics: 'Estadísticas',
    statsExample: 'Muestra el dashboard general',
    byType: 'Por tipo',
    byTypeExample: 'Analiza operaciones por tipo de producto',
    listings: 'Listados',
    listingsExample: 'Lista operaciones con monto mayor a 100,000',
    swiftMessages: 'Mensajes SWIFT',
    swiftExample: 'Analiza los mensajes SWIFT',
    swiftSearch: 'Buscar en SWIFT',
    swiftSearchExample: 'Buscar texto en mensajes SWIFT',
    swiftSearchResults: 'Se encontraron {{count}} mensajes que contienen "{{text}}"',
    swiftSearchNoResults: 'No se encontraron mensajes que contengan "{{text}}"',
    swiftSearchPrompt: 'Por favor especifica qué texto buscar. Ejemplo: "buscar en swift BENEFICIARY"',
    messageContent: 'Contenido',
    messageType: 'Tipo',
    sender: 'Remitente',
    receiver: 'Destinatario',
    alerts: 'Alertas',
    alertsExample: 'Muestra alertas del sistema',
    accounting: 'Contabilidad',
    accountingExample: 'Resumen contable o Saldo cuenta 1101',
    // Saldo por referencia de operación
    operationBalance: 'Balance Contable de Operación',
    operationBalanceFor: 'Balance contable de la operación {{reference}}',
    operationNotFound: 'No se encontraron asientos contables para la operación {{reference}}',
    operationNoEntries: 'La operación {{reference}} no tiene asientos contables en el libro mayor.',
    operationEntries: 'Operación {{reference}}: {{count}} asientos contables',
    netBalance: 'Saldo Neto',
    entriesCount: 'Asientos',
    sampleEntries: 'Muestra de Asientos',
    valueDate: 'Fecha Valor',
    operationBalanceExample: 'Saldo contable de la operación B145061',
    balanceTimeline: 'Timeline de Saldo por Cuenta',
    // Meses
    monthJan: 'Ene', monthFeb: 'Feb', monthMar: 'Mar', monthApr: 'Abr',
    monthMay: 'May', monthJun: 'Jun', monthJul: 'Jul', monthAug: 'Ago',
    monthSep: 'Sep', monthOct: 'Oct', monthNov: 'Nov', monthDec: 'Dic',
    // Tipos de producto (con prefijo de referencia)
    productType_LC_IMPORT: 'LC Importación (I*)',
    productType_LC_EXPORT: 'LC Exportación (L*)',
    productType_GUARANTEE: 'Garantía (A*)',
    productType_GUARANTEE_ISSUED: 'Garantía Emitida (B*)',
    productType_GUARANTEE_RECEIVED: 'Garantía Recibida (J*)',
    productType_AVAL: 'Aval Bancario (K*)',
    productType_STANDBY_LC: 'Standby LC (S*)',
    productType_COLLECTION_IMPORT: 'Cobranza Importación (IE*)',
    productType_COLLECTION_EXPORT: 'Cobranza Exportación (E*, G*)',
    productType_COLLECTION: 'Cobranza',
    productType_FREE_MESSAGE: 'Mensaje Libre',
    productType_TRANSFERABLE_LC: 'LC Transferible',
    productType_BACK_TO_BACK_LC: 'LC Back-to-Back',
    productType_LC_AMENDMENT: 'Enmienda LC',
  },
};

// Helper para obtener traducción
const t = (key: string, params?: Record<string, any>): string => {
  const lang = i18next.language?.startsWith('es') ? 'es' : 'en';
  // Primero buscar en traducciones locales
  let text = translations[lang][key as keyof typeof translations.en];
  // Si no se encuentra, buscar en i18next (para claves como 'productTypes.LC_IMPORT')
  if (!text) {
    const i18nText = i18next.t(`operations.${key}`);
    text = i18nText !== `operations.${key}` ? i18nText : key;
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{{${k}}}`, String(v));
    });
  }
  return text;
};

// Tipos de resultado que puede generar el AI
export type AIResultType = 'chart' | 'table' | 'kpi' | 'text' | 'error';

export interface AIResult {
  type: AIResultType;
  title: string;
  description?: string;
  data: any;
  chartConfig?: ChartConfig;
  tableConfig?: TableConfig;
}

export interface TableConfig {
  drilldown?: {
    enabled: boolean;
    type: 'account-transactions';
    keyColumns: {
      account: string;
      currency: string;
    };
  };
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
}

export interface KPIData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  results: AIResult[];
  suggestions?: string[];
}

// Patrones para identificar intención del usuario
const INTENT_PATTERNS = {
  // Operaciones por vencer
  EXPIRING_OPERATIONS: [
    /operaciones?.*(por\s+)?venc(er|imiento)/i,
    /venc(en|imiento|idas?).*operaciones?/i,
    /(pr[oó]ximas?\s+a\s+)?vencer/i,
    /expir(ing|e|an)/i,
  ],
  // Resumen de montos
  AMOUNT_SUMMARY: [
    /cu[aá]nto.*dinero/i,
    /monto.*total/i,
    /total.*monto/i,
    /sum(a|ario).*monto/i,
    /volumen.*operaciones?/i,
  ],
  // Comparación mensual
  MONTHLY_COMPARISON: [
    /compar(a|ar|aci[oó]n).*mes/i,
    /mes.*a.*mes/i,
    /mensual/i,
    /por.*mes/i,
    /tendencia/i,
  ],
  // Estadísticas generales
  STATISTICS: [
    /estad[ií]sticas?/i,
    /resumen.*general/i,
    /dashboard/i,
    /overview/i,
    /estado.*actual/i,
  ],
  // Operaciones por tipo
  BY_PRODUCT_TYPE: [
    /por.*tipo/i,
    /tipos?.*de.*operaci[oó]n/i,
    /lc.*import/i,
    /lc.*export/i,
    /garant[ií]as?/i,
    /cobranzas?/i,
  ],
  // Listado con filtros
  LIST_OPERATIONS: [
    /lista(r|do)?.*operaciones?/i,
    /muestra.*operaciones?/i,
    /operaciones?.*con.*monto/i,
    /operaciones?.*mayor/i,
    /operaciones?.*menor/i,
  ],
  // Mensajes SWIFT
  SWIFT_MESSAGES: [
    /mensajes?.*swift/i,
    /swift.*messages?/i,
    /mt\d{3}/i,
    /pendientes?.*respuesta/i,
  ],
  // Búsqueda en mensajes SWIFT
  SWIFT_SEARCH: [
    /buscar.*(?:en\s+)?(?:mensaje|swift)/i,
    /search.*(?:in\s+)?(?:message|swift)/i,
    /swift.*(?:que\s+)?(?:contenga|contiene|contain)/i,
    /mensaje.*(?:que\s+)?(?:contenga|contiene|contain)/i,
    /encontrar.*(?:en\s+)?swift/i,
    /find.*(?:in\s+)?swift/i,
    /texto.*(?:en\s+)?swift/i,
    /text.*(?:in\s+)?swift/i,
  ],
  // Alertas
  ALERTS: [
    /alertas?/i,
    /problemas?/i,
    /atenci[oó]n/i,
    /urgente/i,
    /cr[ií]tic(o|as?)/i,
  ],
  // Contabilidad / GLE
  ACCOUNTING: [
    /contab(ilidad)?/i,
    /asientos?.*contables?/i,
    /libro.*mayor/i,
    /gle/i,
    /general.*ledger/i,
    /d[ée]bitos?.*cr[ée]ditos?/i,
    /cuentas?.*contables?/i,
    /balance/i,
    /movimientos?.*contables?/i,
  ],
  // Cuentas específicas
  ACCOUNT_BALANCE: [
    /saldo.*cuenta/i,
    /cuenta.*\d+/i,
    /balance.*cuenta/i,
    /movimientos?.*cuenta/i,
  ],
  // Saldo contable por referencia de operación
  OPERATION_BALANCE: [
    /saldo.*contable.*(?:operaci[oó]n|referencia)/i,
    /saldo.*(?:operaci[oó]n|referencia)/i,
    /(?:operaci[oó]n|referencia).*saldo/i,
    /resumen.*contable.*(?:operaci[oó]n|referencia)/i,
    /contabilidad.*(?:operaci[oó]n|referencia)/i,
    /balance.*(?:operaci[oó]n|referencia)/i,
    /asientos?.*(?:operaci[oó]n|referencia)/i,
    /gle.*(?:operaci[oó]n|referencia)/i,
    /buscar.*referencia/i,
    /search.*reference/i,
    /referencia.*gle/i,
    /gle.*reference/i,
  ],
  // Informe global por cuenta contable
  GLOBAL_ACCOUNT_REPORT: [
    /informe.*global.*cuenta/i,
    /reporte.*global.*cuenta/i,
    /resumen.*(?:todas|global).*cuentas?/i,
    /saldos?.*(?:todas|global).*cuentas?/i,
    /balance.*general.*cuentas?/i,
    /cuentas?.*contables?.*(?:resumen|saldo|balance)/i,
    /todas.*(?:las\s+)?cuentas?.*contables?/i,
    /informe.*cuentas?.*contables?/i,
    /reporte.*cuentas?.*contables?/i,
    /global.*account/i,
    /all.*accounts?.*balance/i,
  ],
  // Comisiones cobradas
  COMMISSIONS_CHARGED: [
    /comision(es)?.*cobrad(a|o|as|os)/i,
    /cobr(o|ar|adas?).*comision(es)?/i,
    /comision(es)?.*cliente/i,
    /commission(s)?.*charged/i,
    /charged.*commission(s)?/i,
    /client.*commission(s)?/i,
    /fee(s)?.*charged/i,
    /comision(es)?/i,
  ],
};

// Patrones para detectar tipo de gráfico preferido
const CHART_TYPE_PATTERNS: Record<ChartConfig['type'], RegExp[]> = {
  bar: [
    /gr[aá]fica?\s*(de\s+)?barras?/i,
    /barras?/i,
    /bar\s*chart/i,
    /en\s+barras?/i,
  ],
  line: [
    /gr[aá]fica?\s*(de\s+)?l[ií]neas?/i,
    /l[ií]neas?/i,
    /line\s*chart/i,
    /en\s+l[ií]neas?/i,
    /tendencia/i,
  ],
  pie: [
    /gr[aá]fica?\s*(de\s+)?(pastel|circular|torta)/i,
    /pastel/i,
    /circular/i,
    /torta/i,
    /pie\s*chart/i,
    /en\s+(pastel|circular)/i,
  ],
  doughnut: [
    /gr[aá]fica?\s*(de\s+)?dona/i,
    /dona/i,
    /doughnut/i,
    /donut/i,
    /anillo/i,
  ],
  area: [
    /gr[aá]fica?\s*(de\s+)?[aá]rea/i,
    /[aá]rea/i,
    /area\s*chart/i,
    /en\s+[aá]rea/i,
  ],
};

// Colores para gráficas
const CHART_COLORS = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F97316', // orange
];

class AIAssistantService {
  // Cache para configuraciones de tipos de producto
  private productTypeConfigs: ProductTypeConfig[] | null = null;

  /**
   * Carga las configuraciones de tipos de producto (con cache)
   */
  private async loadProductTypeConfigs(): Promise<ProductTypeConfig[]> {
    if (!this.productTypeConfigs) {
      try {
        this.productTypeConfigs = await productTypeConfigService.getAllConfigs();
      } catch (error) {
        console.warn('Could not load product type configs:', error);
        this.productTypeConfigs = [];
      }
    }
    return this.productTypeConfigs;
  }

  /**
   * Procesa un prompt del usuario y genera respuesta
   */
  async processPrompt(prompt: string): Promise<AIResponse> {
    try {
      // Pre-cargar configuraciones de tipos de producto para formateo
      await this.loadProductTypeConfigs();

      const intent = this.detectIntent(prompt);
      const preferredChartType = this.detectChartType(prompt);

      let response: AIResponse;

      switch (intent) {
        case 'EXPIRING_OPERATIONS':
          response = await this.handleExpiringOperations(prompt);
          break;
        case 'AMOUNT_SUMMARY':
          response = await this.handleAmountSummary(prompt);
          break;
        case 'MONTHLY_COMPARISON':
          response = await this.handleMonthlyComparison(prompt);
          break;
        case 'STATISTICS':
          response = await this.handleStatistics(prompt);
          break;
        case 'BY_PRODUCT_TYPE':
          response = await this.handleByProductType(prompt);
          break;
        case 'LIST_OPERATIONS':
          response = await this.handleListOperations(prompt);
          break;
        case 'SWIFT_MESSAGES':
          response = await this.handleSwiftMessages(prompt);
          break;
        case 'SWIFT_SEARCH':
          response = await this.handleSwiftSearch(prompt);
          break;
        case 'ALERTS':
          response = await this.handleAlerts(prompt);
          break;
        case 'ACCOUNTING':
          response = await this.handleAccounting(prompt);
          break;
        case 'ACCOUNT_BALANCE':
          response = await this.handleAccountBalance(prompt);
          break;
        case 'OPERATION_BALANCE':
          response = await this.handleOperationBalance(prompt);
          break;
        case 'GLOBAL_ACCOUNT_REPORT':
          response = await this.handleGlobalAccountReport();
          break;
        case 'COMMISSIONS_CHARGED':
          response = await this.handleCommissionsCharged(prompt);
          break;
        default:
          response = this.handleUnknown(prompt);
      }

      // Aplicar tipo de gráfico preferido si el usuario lo especificó
      if (preferredChartType && response.results) {
        response.results = this.applyChartType(response.results, preferredChartType);
      }

      return response;
    } catch (error) {
      console.error('AI Assistant error:', error);
      return {
        success: false,
        message: 'Error al procesar la solicitud',
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: error instanceof Error ? error.message : 'Error desconocido' }
        }],
      };
    }
  }

  /**
   * Detecta la intención del usuario
   */
  private detectIntent(prompt: string): string | null {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(prompt)) {
          return intent;
        }
      }
    }
    return null;
  }

  /**
   * Detecta el tipo de gráfico preferido del usuario
   */
  private detectChartType(prompt: string): ChartConfig['type'] | null {
    for (const [chartType, patterns] of Object.entries(CHART_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(prompt)) {
          return chartType as ChartConfig['type'];
        }
      }
    }
    return null;
  }

  /**
   * Aplica el tipo de gráfico preferido a los resultados
   */
  private applyChartType(results: AIResult[], chartType: ChartConfig['type'] | null): AIResult[] {
    if (!chartType) return results;

    return results.map(result => {
      if (result.type === 'chart' && result.chartConfig) {
        return {
          ...result,
          chartConfig: {
            ...result.chartConfig,
            type: chartType,
          },
        };
      }
      return result;
    });
  }

  /**
   * Operaciones por vencer
   */
  private async handleExpiringOperations(prompt: string): Promise<AIResponse> {
    // Detectar rango de tiempo
    const days = this.extractDays(prompt) || 30;

    const operations = await operationsApi.getOperations();
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = operations.filter(op => {
      if (!op.expiryDate) return false;
      const expiry = new Date(op.expiryDate);
      return expiry >= today && expiry <= futureDate;
    }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

    // Agrupar por semana
    const byWeek: Record<string, number> = {};
    expiring.forEach(op => {
      const weekStart = this.getWeekStart(new Date(op.expiryDate!));
      const key = weekStart.toISOString().split('T')[0];
      byWeek[key] = (byWeek[key] || 0) + 1;
    });

    const chartData = Object.entries(byWeek).map(([date, count]) => ({
      semana: this.formatWeek(date),
      operaciones: count,
    }));

    return {
      success: true,
      message: `Encontré ${expiring.length} operaciones por vencer en los próximos ${days} días`,
      results: [
        {
          type: 'kpi',
          title: 'Resumen de Vencimientos',
          data: [
            { label: 'Por vencer', value: expiring.length, color: 'orange', icon: 'clock' },
            { label: 'Esta semana', value: expiring.filter(op => this.isThisWeek(new Date(op.expiryDate!))).length, color: 'red', icon: 'alert' },
            { label: 'Próximo mes', value: expiring.filter(op => this.isNextMonth(new Date(op.expiryDate!))).length, color: 'blue', icon: 'calendar' },
          ] as KPIData[],
        },
        {
          type: 'chart',
          title: 'Operaciones por Semana de Vencimiento',
          data: chartData,
          chartConfig: {
            type: 'bar',
            xAxis: 'semana',
            yAxis: 'operaciones',
            colors: ['#DD6B20'],
          },
        },
        {
          type: 'table',
          title: 'Detalle de Operaciones por Vencer',
          data: expiring.slice(0, 10).map(op => ({
            Referencia: op.reference,
            Tipo: this.formatProductType(op.productType),
            Monto: `${op.currency} ${op.amount?.toLocaleString()}`,
            Vencimiento: this.formatDate(op.expiryDate),
            Estado: op.status,
          })),
        },
      ],
      suggestions: [
        'Muestra operaciones que vencen esta semana',
        'Lista las LCs con monto mayor a 100,000 USD',
        'Estadísticas generales del sistema',
      ],
    };
  }

  /**
   * Resumen de montos
   */
  private async handleAmountSummary(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();
    const activeOps = operations.filter(op => op.status === 'ACTIVE');

    // Agrupar por moneda
    const byCurrency: Record<string, number> = {};
    activeOps.forEach(op => {
      if (op.currency && op.amount) {
        byCurrency[op.currency] = (byCurrency[op.currency] || 0) + op.amount;
      }
    });

    // Agrupar por tipo de producto
    const byProduct: Record<string, number> = {};
    activeOps.forEach(op => {
      const type = this.formatProductType(op.productType);
      byProduct[type] = (byProduct[type] || 0) + (op.amount || 0);
    });

    const kpis: KPIData[] = Object.entries(byCurrency).map(([currency, total], idx) => ({
      label: `Total ${currency}`,
      value: total.toLocaleString(),
      color: CHART_COLORS[idx % CHART_COLORS.length],
      icon: 'dollar',
    }));

    return {
      success: true,
      message: `Resumen de montos de ${activeOps.length} operaciones activas`,
      results: [
        {
          type: 'kpi',
          title: 'Totales por Moneda',
          data: kpis,
        },
        {
          type: 'chart',
          title: 'Distribución por Tipo de Operación',
          data: Object.entries(byProduct).map(([tipo, monto]) => ({ tipo, monto })),
          chartConfig: {
            type: 'pie',
            colors: CHART_COLORS,
          },
        },
        {
          type: 'chart',
          title: 'Montos por Moneda',
          data: Object.entries(byCurrency).map(([moneda, total]) => ({ moneda, total })),
          chartConfig: {
            type: 'bar',
            xAxis: 'moneda',
            yAxis: 'total',
            colors: CHART_COLORS,
          },
        },
      ],
      suggestions: [
        'Comparación mes a mes',
        'Operaciones por vencer',
        'Lista operaciones mayores a 500,000',
      ],
    };
  }

  /**
   * Comparación mensual
   */
  private async handleMonthlyComparison(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();

    // Agrupar por mes de creación
    const byMonth: Record<string, { count: number; amount: number }> = {};
    operations.forEach(op => {
      if (op.issueDate) {
        const month = op.issueDate.substring(0, 7); // YYYY-MM
        if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0 };
        byMonth[month].count++;
        byMonth[month].amount += op.amount || 0;
      }
    });

    // Ordenar y tomar últimos 12 meses
    const sortedMonths = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    const chartData = sortedMonths.map(([month, data]) => ({
      mes: this.formatMonth(month),
      operaciones: data.count,
      monto: data.amount,
    }));

    return {
      success: true,
      message: 'Comparación de los últimos 12 meses',
      results: [
        {
          type: 'chart',
          title: 'Cantidad de Operaciones por Mes',
          data: chartData,
          chartConfig: {
            type: 'line',
            xAxis: 'mes',
            yAxis: 'operaciones',
            colors: ['#3182CE'],
          },
        },
        {
          type: 'chart',
          title: 'Volumen (Monto) por Mes',
          data: chartData,
          chartConfig: {
            type: 'area',
            xAxis: 'mes',
            yAxis: 'monto',
            colors: ['#38A169'],
          },
        },
      ],
      suggestions: [
        'Estadísticas generales',
        'Operaciones por tipo',
        'Alertas pendientes',
      ],
    };
  }

  /**
   * Estadísticas generales
   */
  private async handleStatistics(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();
    const messages = await swiftMessagesApi.getMessages();

    const activeOps = operations.filter(op => op.status === 'ACTIVE');
    const pendingResponse = operations.filter(op => op.status === 'PENDING_RESPONSE');

    // Por tipo
    const byType: Record<string, number> = {};
    operations.forEach(op => {
      const type = this.formatProductType(op.productType);
      byType[type] = (byType[type] || 0) + 1;
    });

    // Por estado
    const byStatus: Record<string, number> = {};
    operations.forEach(op => {
      byStatus[op.status] = (byStatus[op.status] || 0) + 1;
    });

    return {
      success: true,
      message: 'Dashboard de estadísticas generales',
      results: [
        {
          type: 'kpi',
          title: 'Indicadores Principales',
          data: [
            { label: 'Total Operaciones', value: operations.length, color: 'blue', icon: 'file' },
            { label: 'Activas', value: activeOps.length, color: 'green', icon: 'check' },
            { label: 'Pendientes Respuesta', value: pendingResponse.length, color: 'orange', icon: 'clock' },
            { label: 'Mensajes SWIFT', value: messages.length, color: 'purple', icon: 'mail' },
          ] as KPIData[],
        },
        {
          type: 'chart',
          title: 'Operaciones por Tipo',
          data: Object.entries(byType).map(([tipo, cantidad]) => ({ tipo, cantidad })),
          chartConfig: {
            type: 'doughnut',
            colors: CHART_COLORS,
          },
        },
        {
          type: 'chart',
          title: 'Operaciones por Estado',
          data: Object.entries(byStatus).map(([estado, cantidad]) => ({ estado, cantidad })),
          chartConfig: {
            type: 'bar',
            xAxis: 'estado',
            yAxis: 'cantidad',
            colors: CHART_COLORS,
          },
        },
      ],
      suggestions: [
        'Operaciones por vencer',
        'Resumen de montos',
        'Mensajes SWIFT pendientes',
      ],
    };
  }

  /**
   * Por tipo de producto
   */
  private async handleByProductType(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();

    const byType: Record<string, { count: number; amount: number; active: number }> = {};
    operations.forEach(op => {
      const type = op.productType;
      if (!byType[type]) byType[type] = { count: 0, amount: 0, active: 0 };
      byType[type].count++;
      byType[type].amount += op.amount || 0;
      if (op.status === 'ACTIVE') byType[type].active++;
    });

    const tableData = Object.entries(byType).map(([type, data]) => ({
      Tipo: this.formatProductType(type),
      'Total Operaciones': data.count,
      'Activas': data.active,
      'Monto Total': data.amount.toLocaleString(),
    }));

    return {
      success: true,
      message: 'Análisis por tipo de producto',
      results: [
        {
          type: 'chart',
          title: 'Distribución por Tipo de Producto',
          data: Object.entries(byType).map(([tipo, data]) => ({
            tipo: this.formatProductType(tipo),
            operaciones: data.count,
          })),
          chartConfig: {
            type: 'pie',
            colors: CHART_COLORS,
          },
        },
        {
          type: 'table',
          title: 'Detalle por Tipo',
          data: tableData,
        },
      ],
    };
  }

  /**
   * Listar operaciones con filtros
   */
  private async handleListOperations(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();
    let filtered = [...operations];

    // Detectar filtro de monto
    const amountMatch = prompt.match(/(\d[\d,\.]*)\s*(usd|eur|mxn)?/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (prompt.includes('mayor') || prompt.includes('más de') || prompt.includes('>')) {
        filtered = filtered.filter(op => (op.amount || 0) > amount);
      } else if (prompt.includes('menor') || prompt.includes('menos de') || prompt.includes('<')) {
        filtered = filtered.filter(op => (op.amount || 0) < amount);
      }
    }

    // Limitar resultados
    filtered = filtered.slice(0, 20);

    return {
      success: true,
      message: `Encontré ${filtered.length} operaciones`,
      results: [
        {
          type: 'table',
          title: 'Listado de Operaciones',
          data: filtered.map(op => ({
            Referencia: op.reference,
            Tipo: this.formatProductType(op.productType),
            Solicitante: op.applicantName || '-',
            Beneficiario: op.beneficiaryName || '-',
            Monto: `${op.currency} ${op.amount?.toLocaleString()}`,
            Estado: op.status,
            Vencimiento: this.formatDate(op.expiryDate),
          })),
        },
      ],
    };
  }

  /**
   * Mensajes SWIFT
   */
  private async handleSwiftMessages(prompt: string): Promise<AIResponse> {
    const messages = await swiftMessagesApi.getMessages();

    // Por tipo de mensaje
    const byType: Record<string, number> = {};
    messages.forEach(msg => {
      byType[msg.messageType] = (byType[msg.messageType] || 0) + 1;
    });

    // Por dirección
    const inbound = messages.filter(m => m.direction === 'INBOUND').length;
    const outbound = messages.filter(m => m.direction === 'OUTBOUND').length;

    return {
      success: true,
      message: `Análisis de ${messages.length} mensajes SWIFT`,
      results: [
        {
          type: 'kpi',
          title: 'Resumen de Mensajes',
          data: [
            { label: 'Total Mensajes', value: messages.length, color: 'blue', icon: 'mail' },
            { label: 'Enviados', value: outbound, color: 'green', icon: 'send' },
            { label: 'Recibidos', value: inbound, color: 'purple', icon: 'inbox' },
          ] as KPIData[],
        },
        {
          type: 'chart',
          title: 'Mensajes por Tipo',
          data: Object.entries(byType).map(([tipo, cantidad]) => ({ tipo, cantidad })),
          chartConfig: {
            type: 'bar',
            xAxis: 'tipo',
            yAxis: 'cantidad',
            colors: CHART_COLORS,
          },
        },
      ],
    };
  }

  /**
   * Búsqueda de texto en mensajes SWIFT
   */
  private async handleSwiftSearch(prompt: string): Promise<AIResponse> {
    // Extraer texto de búsqueda del prompt
    const searchMatch = prompt.match(/(?:buscar|search|encontrar|find|texto|text|contenga|contain)[^\w]*(?:en\s+)?(?:swift|mensaje)?[^\w]*["""]?([^"""]+)["""]?/i) ||
                        prompt.match(/swift[^\w]+(?:que\s+)?(?:contenga|contain)[^\w]*["""]?([^"""]+)["""]?/i) ||
                        prompt.match(/["""]([^"""]+)[""][^\w]*(?:en\s+)?swift/i);

    // Si no hay patrón claro, intentar extraer las últimas palabras significativas
    let searchText = searchMatch ? searchMatch[1].trim() : null;

    if (!searchText) {
      // Intentar extraer texto después de palabras clave
      const words = prompt.split(/\s+/);
      const keywordIndex = words.findIndex(w => /buscar|search|swift|mensaje|message/i.test(w));
      if (keywordIndex >= 0 && keywordIndex < words.length - 1) {
        searchText = words.slice(keywordIndex + 1).join(' ').replace(/^(en|in|swift|mensaje|message)\s+/i, '').trim();
      }
    }

    if (!searchText || searchText.length < 2) {
      return {
        success: false,
        message: t('swiftSearchPrompt'),
        results: [{
          type: 'text',
          title: t('swiftSearch'),
          data: {
            content: t('swiftSearchPrompt'),
          }
        }],
        suggestions: [
          'buscar en swift BENEFICIARY',
          'search in swift MT700',
          'swift que contenga USD',
        ],
      };
    }

    try {
      const messages = await swiftMessagesApi.searchByText(searchText);

      if (messages.length === 0) {
        return {
          success: true,
          message: t('swiftSearchNoResults', { text: searchText }),
          results: [{
            type: 'text',
            title: t('swiftSearch'),
            data: { content: t('swiftSearchNoResults', { text: searchText }) }
          }],
          suggestions: [t('swiftMessages'), t('statistics')],
        };
      }

      // Agrupar por tipo de mensaje
      const byType: Record<string, number> = {};
      messages.forEach(msg => {
        byType[msg.messageType] = (byType[msg.messageType] || 0) + 1;
      });

      return {
        success: true,
        message: t('swiftSearchResults', { count: messages.length, text: searchText }),
        results: [
          {
            type: 'kpi',
            title: t('swiftSearchResults', { count: messages.length, text: searchText }),
            data: [
              { label: 'Total', value: messages.length, color: 'blue', icon: 'mail' },
              { label: 'INBOUND', value: messages.filter(m => m.direction === 'INBOUND').length, color: 'purple', icon: 'inbox' },
              { label: 'OUTBOUND', value: messages.filter(m => m.direction === 'OUTBOUND').length, color: 'green', icon: 'send' },
            ] as KPIData[],
          },
          {
            type: 'chart',
            title: t('messageType'),
            data: Object.entries(byType).map(([tipo, cantidad]) => ({ tipo, cantidad })),
            chartConfig: {
              type: 'bar',
              xAxis: 'tipo',
              yAxis: 'cantidad',
              colors: CHART_COLORS,
            },
          },
          {
            type: 'table',
            title: t('swiftMessages'),
            data: messages.slice(0, 20).map(msg => ({
              [t('messageType')]: msg.messageType,
              [t('reference')]: msg.field20Reference || '-',
              [t('sender')]: msg.senderBic || '-',
              [t('receiver')]: msg.receiverBic || '-',
              [t('date')]: this.formatDate(msg.createdAt),
              [t('description')]: msg.swiftContent?.substring(0, 100) + '...' || '-',
            })),
          },
        ],
        suggestions: [
          t('swiftMessages'),
          `buscar en swift ${searchText} MT700`,
        ],
      };
    } catch (error) {
      console.error('Error searching SWIFT messages:', error);
      return {
        success: false,
        message: 'Error al buscar en mensajes SWIFT',
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: error instanceof Error ? error.message : 'Error desconocido' }
        }],
      };
    }
  }

  /**
   * Alertas
   */
  private async handleAlerts(prompt: string): Promise<AIResponse> {
    const operations = await operationsApi.getOperations();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const alerts = {
      expiringThisWeek: operations.filter(op => {
        if (!op.expiryDate) return false;
        const expiry = new Date(op.expiryDate);
        return expiry >= today && expiry <= nextWeek;
      }),
      pendingResponse: operations.filter(op => op.status === 'PENDING_RESPONSE'),
      overdue: operations.filter(op => {
        if (!op.expiryDate) return false;
        return new Date(op.expiryDate) < today && op.status === 'ACTIVE';
      }),
    };

    return {
      success: true,
      message: 'Alertas del sistema',
      results: [
        {
          type: 'kpi',
          title: 'Alertas Activas',
          data: [
            { label: 'Vencen esta semana', value: alerts.expiringThisWeek.length, color: 'orange', icon: 'clock' },
            { label: 'Pendientes respuesta', value: alerts.pendingResponse.length, color: 'yellow', icon: 'alert' },
            { label: 'Vencidas', value: alerts.overdue.length, color: 'red', icon: 'x' },
          ] as KPIData[],
        },
        {
          type: 'table',
          title: 'Operaciones Críticas',
          data: [...alerts.overdue, ...alerts.expiringThisWeek].slice(0, 10).map(op => ({
            Referencia: op.reference,
            Tipo: this.formatProductType(op.productType),
            Monto: `${op.currency} ${op.amount?.toLocaleString()}`,
            Vencimiento: this.formatDate(op.expiryDate),
            Alerta: alerts.overdue.includes(op) ? 'VENCIDA' : 'Por vencer',
          })),
        },
      ],
    };
  }

  /**
   * Contabilidad / GLE
   */
  private async handleAccounting(prompt: string): Promise<AIResponse> {
    try {
      const stats = await gleService.getAIStats();

      // Preparar KPIs
      const kpis: KPIData[] = [
        { label: t('totalEntries'), value: stats.totalEntries?.toLocaleString() || '0', color: 'blue', icon: 'file' },
        { label: t('totalDebits'), value: this.formatCurrency(stats.totalDebits), color: 'green', icon: 'dollar' },
        { label: t('totalCredits'), value: this.formatCurrency(stats.totalCredits), color: 'purple', icon: 'dollar' },
      ];

      // Datos por moneda para gráfica
      const currencyData = Object.entries(stats.byCurrency || {}).map(([currency, data]) => ({
        [t('currency')]: currency,
        [t('debits')]: data.debits || 0,
        [t('credits')]: data.credits || 0,
      }));

      // Tendencia mensual
      const monthlyData = this.processMonthlyGleData(stats.monthlyTrend || []);

      return {
        success: true,
        message: t('accountingSummary', { count: stats.totalEntries?.toLocaleString() || 0 }),
        results: [
          {
            type: 'kpi',
            title: t('accountingIndicators'),
            data: kpis,
          },
          {
            type: 'chart',
            title: t('debitsVsCredits'),
            data: currencyData,
            chartConfig: {
              type: 'bar',
              xAxis: t('currency'),
              colors: ['#38A169', '#805AD5'],
            },
          },
          {
            type: 'chart',
            title: t('monthlyTrend'),
            data: monthlyData,
            chartConfig: {
              type: 'line',
              xAxis: 'mes',
              colors: ['#3182CE'],
            },
          },
        ],
        suggestions: [
          t('showLastEntries'),
          t('accountBalance') + ' 1101',
          t('monthlyMovements'),
          t('balanceByCurrency'),
        ],
      };
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      return {
        success: false,
        message: t('accountingError'),
        results: [{
          type: 'error',
          title: t('accounting'),
          data: { message: t('accountingServiceError') }
        }],
        suggestions: [t('generalStats'), t('activeOperations')],
      };
    }
  }

  /**
   * Balance de cuenta específica
   */
  private async handleAccountBalance(prompt: string): Promise<AIResponse> {
    try {
      // Extraer número de cuenta del prompt
      const accountMatch = prompt.match(/cuenta\s*(\d+)/i) || prompt.match(/account\s*(\d+)/i) || prompt.match(/(\d{4,})/);
      const accountNumber = accountMatch ? accountMatch[1] : null;

      if (accountNumber) {
        // Usar búsqueda por prefijo para encontrar cuentas que INICIEN con el número
        const entries = await gleService.getByAccountPrefix(accountNumber);

        if (entries.length === 0) {
          return {
            success: true,
            message: t('noMovementsFound', { account: accountNumber }),
            results: [{
              type: 'text',
              title: t('accountsSummary'),
              data: { content: t('accountNoMovements', { account: accountNumber }) }
            }],
            suggestions: [t('accounting'), t('recentEntries')],
          };
        }

        // Calcular totales
        let totalDebits = 0;
        let totalCredits = 0;
        entries.forEach(entry => {
          if (entry.dbtcdt === 'D') {
            totalDebits += entry.amt || 0;
          } else {
            totalCredits += entry.amt || 0;
          }
        });

        const balanceAmount = totalDebits - totalCredits;

        // Agrupar por cuenta para gráfico de barras
        const accountSummary: Record<string, { debits: number; credits: number }> = {};
        entries.forEach(entry => {
          const acc = entry.act || 'N/A';
          if (!accountSummary[acc]) {
            accountSummary[acc] = { debits: 0, credits: 0 };
          }
          if (entry.dbtcdt === 'D') {
            accountSummary[acc].debits += entry.amt || 0;
          } else {
            accountSummary[acc].credits += entry.amt || 0;
          }
        });

        // Datos para gráfico de barras (Débitos vs Créditos por cuenta)
        const barChartData = Object.entries(accountSummary)
          .slice(0, 10)
          .map(([account, data]) => ({
            name: account.length > 15 ? account.substring(0, 15) + '...' : account,
            [t('debits')]: Math.round(data.debits),
            [t('credits')]: Math.round(data.credits),
          }));

        // Agrupar por mes para timeline
        const monthlyData: Record<string, { debits: number; credits: number }> = {};
        entries.forEach(entry => {
          if (entry.valdat) {
            const date = new Date(entry.valdat);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { debits: 0, credits: 0 };
            }
            if (entry.dbtcdt === 'D') {
              monthlyData[monthKey].debits += entry.amt || 0;
            } else {
              monthlyData[monthKey].credits += entry.amt || 0;
            }
          }
        });

        // Datos para timeline (últimos 12 meses)
        const timelineData = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, data]) => ({
            name: month,
            [t('debits')]: Math.round(data.debits),
            [t('credits')]: Math.round(data.credits),
          }));

        return {
          success: true,
          message: t('accountMovements', { account: accountNumber, count: entries.length }),
          results: [
            {
              type: 'kpi',
              title: t('accountBalanceTitle', { account: accountNumber }),
              data: [
                { label: t('debits'), value: this.formatCurrency(totalDebits), color: 'green', icon: 'dollar' },
                { label: t('credits'), value: this.formatCurrency(totalCredits), color: 'purple', icon: 'dollar' },
                { label: t('balance'), value: this.formatCurrency(balanceAmount), color: balanceAmount >= 0 ? 'blue' : 'red', icon: 'check' },
                { label: t('movements'), value: entries.length, color: 'gray', icon: 'file' },
              ] as KPIData[],
            },
            {
              type: 'chart',
              title: t('debitsVsCredits'),
              data: barChartData,
              chartConfig: {
                type: 'bar',
                colors: ['#38A169', '#805AD5'],
              },
            },
            {
              type: 'chart',
              title: t('monthlyTrend'),
              data: timelineData,
              chartConfig: {
                type: 'area',
                colors: ['#38A169', '#805AD5'],
              },
            },
            {
              type: 'table',
              title: t('lastMovements'),
              data: entries.slice(0, 10).map(e => ({
                [t('date')]: this.formatDate(e.valdat),
                [t('account')]: e.act || '-',
                [t('reference')]: e.txt2 || e.tsyref || '-',
                [t('type')]: e.dbtcdt === 'D' ? t('debit') : t('credit'),
                [t('currency')]: e.cur,
                [t('amount')]: e.amt?.toLocaleString() || '0',
                [t('description')]: e.txt1 || '-',
              })),
            },
          ],
          suggestions: [
            t('generalAccountingSummary'),
            t('movementsByCurrency'),
          ],
        };
      }

      // Si no hay cuenta específica, mostrar resumen por cuentas
      const accountData = await gleService.getByAccount();
      const summaryByAccount: Record<string, { debits: number; credits: number }> = {};

      accountData.forEach(item => {
        if (!summaryByAccount[item.account]) {
          summaryByAccount[item.account] = { debits: 0, credits: 0 };
        }
        if (item.type === 'debit') {
          summaryByAccount[item.account].debits += item.total;
        } else {
          summaryByAccount[item.account].credits += item.total;
        }
      });

      const tableData = Object.entries(summaryByAccount)
        .map(([account, data]) => ({
          [t('account')]: account,
          [t('debits')]: this.formatCurrency(data.debits),
          [t('credits')]: this.formatCurrency(data.credits),
          [t('balance')]: this.formatCurrency(data.debits - data.credits),
        }))
        .slice(0, 20);

      return {
        success: true,
        message: t('accountsSummary'),
        results: [
          {
            type: 'table',
            title: t('balanceByAccount'),
            data: tableData,
          },
        ],
        suggestions: [
          t('accountBalance') + ' 1101',
          t('monthlyMovements'),
          t('accounting'),
        ],
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return {
        success: false,
        message: t('accountBalanceError'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: t('accountInfoError') }
        }],
      };
    }
  }

  /**
   * Saldo contable por referencia de operación
   */
  private async handleOperationBalance(prompt: string): Promise<AIResponse> {
    try {
      // Extraer referencia del prompt - buscar patrones como B145061, LC-2024-001, etc.
      const refMatch = prompt.match(/(?:referencia|operaci[oó]n|reference)\s+([A-Z0-9\-]+)/i) ||
                       prompt.match(/buscar.*?([A-Z]{2,}-\d{4}-\d+)/i) ||
                       prompt.match(/search.*?([A-Z]{2,}-\d{4}-\d+)/i) ||
                       prompt.match(/([A-Z]{2,}-\d{4}-\d+)/i) ||
                       prompt.match(/([A-Z]\d{5,})/i) ||
                       prompt.match(/\b([A-Z0-9]{6,})\b/i);

      const reference = refMatch ? refMatch[1].toUpperCase() : null;

      if (!reference) {
        return {
          success: false,
          message: t('operationNotFound', { reference: 'desconocida' }),
          results: [{
            type: 'text',
            title: t('operationBalance'),
            data: {
              content: i18next.language?.startsWith('es')
                ? 'Por favor especifica una referencia de operación. Ejemplo: "saldo contable de la operación B145061"'
                : 'Please specify an operation reference. Example: "accounting balance for operation B145061"'
            }
          }],
          suggestions: [t('accounting'), t('operationBalanceExample')],
        };
      }

      // Obtener balance de la operación
      const balance = await gleService.getOperationBalance(reference);

      if (!balance.found) {
        return {
          success: true,
          message: t('operationNotFound', { reference }),
          results: [{
            type: 'text',
            title: t('operationBalance'),
            data: { content: t('operationNoEntries', { reference }) }
          }],
          suggestions: [t('accounting'), t('recentEntries')],
        };
      }

      // Preparar KPIs por moneda
      const kpis: KPIData[] = [];
      const currencyBalances = balance.byCurrency || [];

      currencyBalances.forEach((cur, idx) => {
        kpis.push({
          label: `${t('debits')} ${cur.currency}`,
          value: this.formatCurrency(cur.debits),
          color: 'green',
          icon: 'dollar',
        });
        kpis.push({
          label: `${t('credits')} ${cur.currency}`,
          value: this.formatCurrency(cur.credits),
          color: 'purple',
          icon: 'dollar',
        });
        kpis.push({
          label: `${t('netBalance')} ${cur.currency}`,
          value: this.formatCurrency(cur.netBalance),
          color: cur.netBalance >= 0 ? 'blue' : 'red',
          icon: 'check',
        });
      });

      kpis.push({
        label: t('entriesCount'),
        value: balance.totalEntries,
        color: 'gray',
        icon: 'file',
      });

      // Calcular saldo por cuenta contable (débitos - créditos)
      const accountBalances: Record<string, { debits: number; credits: number; currency: string }> = {};
      (balance.entries || []).forEach(e => {
        const key = `${e.account}|${e.currency}`;
        if (!accountBalances[key]) {
          accountBalances[key] = { debits: 0, credits: 0, currency: e.currency };
        }
        if (e.type === 'D') {
          accountBalances[key].debits += e.amount || 0;
        } else {
          accountBalances[key].credits += e.amount || 0;
        }
      });

      // Tabla de saldos por cuenta
      const balanceByAccountTable = Object.entries(accountBalances)
        .map(([key, data]) => {
          const account = key.split('|')[0];
          const saldo = data.debits - data.credits;
          return {
            [t('account')]: account,
            [t('currency')]: data.currency,
            [t('debits')]: data.debits.toLocaleString(),
            [t('credits')]: data.credits.toLocaleString(),
            [t('balance')]: saldo.toLocaleString(),
          };
        })
        .sort((a, b) => a[t('account')].localeCompare(b[t('account')]));

      // Preparar tabla de asientos detallados
      const entriesTable = (balance.entries || []).map(e => ({
        [t('account')]: e.account,
        [t('reference')]: e.description2 || '-',
        [t('type')]: e.type === 'D' ? t('debit') : t('credit'),
        [t('currency')]: e.currency,
        [t('amount')]: e.amount?.toLocaleString() || '0',
        [t('valueDate')]: this.formatDate(e.valueDate),
        [t('description')]: e.description || '-',
      }));

      // Preparar datos para gráfica de saldo por cuenta
      const chartData = Object.entries(accountBalances)
        .map(([key, data]) => {
          const account = key.split('|')[0];
          const saldo = data.debits - data.credits;
          return {
            name: account.length > 15 ? account.substring(0, 15) + '...' : account,
            [t('balance')]: Math.round(saldo),
            fullAccount: account,
            currency: data.currency,
          };
        })
        .sort((a, b) => Math.abs(b[t('balance')] as number) - Math.abs(a[t('balance')] as number))
        .slice(0, 12);

      // Preparar datos para timeline de saldo acumulado por cuenta
      // Créditos incrementan, débitos disminuyen
      const entries = balance.entries || [];
      const sortedEntries = [...entries].sort((a, b) =>
        new Date(a.valueDate).getTime() - new Date(b.valueDate).getTime()
      );

      // Obtener las cuentas principales (top 6 por volumen)
      const topAccounts = Object.entries(accountBalances)
        .sort((a, b) => (b[1].debits + b[1].credits) - (a[1].debits + a[1].credits))
        .slice(0, 6)
        .map(([key]) => key.split('|')[0]);

      // Calcular saldo acumulado por fecha y cuenta
      const cumulativeByDate: Record<string, Record<string, number>> = {};
      const runningBalance: Record<string, number> = {};

      // Inicializar saldos en 0
      topAccounts.forEach(acc => { runningBalance[acc] = 0; });

      sortedEntries.forEach(entry => {
        if (!topAccounts.includes(entry.account)) return;

        const dateKey = this.formatDate(entry.valueDate);
        const amount = entry.amount || 0;

        // Créditos suman, débitos restan
        if (entry.type === 'C') {
          runningBalance[entry.account] = (runningBalance[entry.account] || 0) + amount;
        } else {
          runningBalance[entry.account] = (runningBalance[entry.account] || 0) - amount;
        }

        if (!cumulativeByDate[dateKey]) {
          cumulativeByDate[dateKey] = {};
        }
        // Guardar el saldo actual de todas las cuentas en esta fecha
        topAccounts.forEach(acc => {
          cumulativeByDate[dateKey][acc] = runningBalance[acc] || 0;
        });
      });

      // Convertir a formato de gráfica de líneas
      const timelineData = Object.entries(cumulativeByDate)
        .map(([date, balances]) => {
          const point: Record<string, string | number> = { name: date };
          topAccounts.forEach(acc => {
            const shortName = acc.length > 10 ? acc.substring(0, 10) : acc;
            point[shortName] = Math.round(balances[acc] || 0);
          });
          return point;
        });

      // Colores para las líneas del timeline
      const timelineColors = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#DD6B20'];

      return {
        success: true,
        message: t('operationEntries', { reference, count: balance.totalEntries }),
        results: [
          {
            type: 'kpi',
            title: t('operationBalanceFor', { reference }),
            data: kpis,
          },
          ...(chartData.length > 0 ? [{
            type: 'chart' as const,
            title: t('balanceByAccount'),
            data: chartData,
            chartConfig: {
              type: 'bar' as const,
              colors: ['#3182CE'],
            },
          }] : []),
          ...(timelineData.length > 1 ? [{
            type: 'chart' as const,
            title: t('balanceTimeline'),
            data: timelineData,
            chartConfig: {
              type: 'line' as const,
              colors: timelineColors.slice(0, topAccounts.length),
            },
          }] : []),
          {
            type: 'table',
            title: t('balanceByAccount'),
            data: balanceByAccountTable,
          },
          {
            type: 'table',
            title: t('sampleEntries'),
            data: entriesTable,
          },
        ],
        suggestions: [
          t('accounting'),
          t('recentEntries'),
          t('balanceByCurrency'),
        ],
      };
    } catch (error) {
      console.error('Error fetching operation balance:', error);
      return {
        success: false,
        message: t('accountBalanceError'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: t('accountInfoError') }
        }],
      };
    }
  }

  /**
   * Informe global por cuenta contable
   * Análisis financiero: agrupa por moneda y cuenta, calcula débitos, créditos y saldo
   * Solo muestra cuentas con longitud >= 15 y saldo positivo (débitos > créditos)
   */
  private async handleGlobalAccountReport(): Promise<AIResponse> {
    try {
      // Obtener el reporte - el productType viene directamente del backend
      // (basado en reference_prefix de product_type_config)
      const report = await gleService.getGlobalAccountReport(true);

      if (!report || !report.accounts || report.accounts.length === 0) {
        return {
          success: false,
          message: t('noMovementsFound', { account: 'global' }),
          results: [{
            type: 'text',
            title: t('globalAccountReport'),
            data: { content: i18next.language?.startsWith('es')
              ? 'No se encontraron cuentas contables con saldo positivo.'
              : 'No accounting accounts found with positive balance.' }
          }],
        };
      }

      // KPIs por moneda - cada moneda con su propio saldo
      const currencyColors: Record<string, string> = {
        'USD': 'blue',
        'EUR': 'purple',
        'MXN': 'green',
        'GBP': 'orange',
        'JPY': 'red',
        'CAD': 'yellow',
        'CHF': 'cyan',
      };

      const kpis: KPIData[] = [
        // Primero el total de cuentas
        { label: t('accountsCount'), value: report.totalAccounts, color: 'gray', icon: 'file' },
        // Luego el saldo por cada moneda
        ...report.byCurrency.map(item => ({
          label: `${t('balance')} ${item.currency}`,
          value: `${item.currency} ${item.balance.toLocaleString()}`,
          color: currencyColors[item.currency] || 'blue',
          icon: 'dollar',
        })),
      ];

      // Gráfica de pie: Distribución por moneda (usando porcentajes para comparar)
      const totalBalance = report.byCurrency.reduce((sum, c) => sum + Math.abs(c.balance), 0);
      const pieData = report.byCurrency.map(item => ({
        name: `${item.currency} (${((Math.abs(item.balance) / totalBalance) * 100).toFixed(1)}%)`,
        [t('amount')]: Math.round(Math.abs(item.balance)),
      }));

      // Crear gráficas separadas por moneda (Top 10 cuentas por cada moneda)
      const currencies = [...new Set(report.accounts.map(a => a.currency))].sort();
      const chartColors: Record<string, string> = {
        'USD': '#3182CE',
        'EUR': '#805AD5',
        'MXN': '#38A169',
        'GBP': '#DD6B20',
        'JPY': '#E53E3E',
        'CAD': '#D69E2E',
        'CHF': '#00B5D8',
      };

      const chartsByCurrency: AIResult[] = currencies.map(currency => {
        const currencyAccounts = report.accounts
          .filter(a => a.currency === currency)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 10)
          .map(item => ({
            name: item.account,
            [t('balance')]: Math.round(item.balance),
          }));

        const currencyTotal = report.byCurrency.find(c => c.currency === currency);
        const totalFormatted = currencyTotal ? this.formatCurrency(currencyTotal.balance) : '';

        return {
          type: 'chart' as const,
          title: `${t('topAccountsByBalance')} - ${currency} (Total: ${totalFormatted})`,
          data: currencyAccounts,
          chartConfig: {
            type: 'horizontalBar' as const,
            xAxis: t('balance'),
            yAxis: 'name',
            colors: [chartColors[currency] || '#3182CE'],
          },
        };
      });

      // Tabla ordenada por moneda y cuenta con conteo de operaciones y tipo de producto
      const tableData = report.accounts.map(item => ({
        [t('currency')]: item.currency,
        [t('account')]: item.account,
        [t('productType')]: item.productType || '-',
        [t('operationsCount')]: item.operationCount || 0,
        [t('debits')]: item.debits.toLocaleString(),
        [t('credits')]: item.credits.toLocaleString(),
        [t('balance')]: item.balance.toLocaleString(),
      }));

      return {
        success: true,
        message: t('globalAccountSummary', { count: report.totalAccounts }),
        results: [
          {
            type: 'kpi',
            title: t('globalAccountReport'),
            data: kpis,
          },
          ...(pieData.length > 1 ? [{
            type: 'chart' as const,
            title: t('distributionByCurrency'),
            data: pieData,
            chartConfig: {
              type: 'pie' as const,
              colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'],
            },
          }] : []),
          ...chartsByCurrency,
          {
            type: 'table',
            title: t('accountBalanceDetails'),
            data: tableData,
            tableConfig: {
              drilldown: {
                enabled: true,
                type: 'account-transactions',
                keyColumns: {
                  account: t('account'),
                  currency: t('currency'),
                },
              },
            },
          },
        ],
        suggestions: [
          t('accounting'),
          t('accountBalance'),
          t('monthlyMovements'),
        ],
      };
    } catch (error) {
      console.error('Error fetching global account report:', error);
      return {
        success: false,
        message: t('accountingError'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: t('accountingServiceError') }
        }],
      };
    }
  }

  /**
   * Extrae el período del prompt del usuario
   */
  private extractPeriodFromPrompt(prompt: string): { months?: number; startDate?: string; endDate?: string } {
    console.log('[AI] extractPeriodFromPrompt input:', prompt);
    const lowerPrompt = prompt.toLowerCase();

    // Detectar "último(s) X mes(es)" o "last X month(s)"
    const monthsMatch = lowerPrompt.match(/(?:últimos?|ultimo|last)\s*(\d+)\s*(?:meses?|months?)/i);
    if (monthsMatch) {
      const result = { months: parseInt(monthsMatch[1], 10) };
      console.log('[AI] extractPeriodFromPrompt matched months pattern:', result);
      return result;
    }

    // Detectar períodos predefinidos
    if (/(?:este|current)\s*(?:mes|month)/i.test(lowerPrompt)) {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { startDate };
    }

    if (/(?:mes\s*pasado|last\s*month|mes\s*anterior)/i.test(lowerPrompt)) {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`,
        endDate: `${endOfLastMonth.getFullYear()}-${String(endOfLastMonth.getMonth() + 1).padStart(2, '0')}-${endOfLastMonth.getDate()}`
      };
    }

    if (/(?:este|current)\s*(?:año|year)/i.test(lowerPrompt)) {
      const now = new Date();
      return { startDate: `${now.getFullYear()}-01-01` };
    }

    if (/(?:año\s*pasado|last\s*year|año\s*anterior)/i.test(lowerPrompt)) {
      const now = new Date();
      const lastYear = now.getFullYear() - 1;
      return { startDate: `${lastYear}-01-01`, endDate: `${lastYear}-12-31` };
    }

    // Detectar trimestre
    if (/(?:este|current)\s*(?:trimestre|quarter)/i.test(lowerPrompt)) {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const startMonth = quarter * 3 + 1;
      return { startDate: `${now.getFullYear()}-${String(startMonth).padStart(2, '0')}-01` };
    }

    // Detectar semestre
    if (/(?:este|current)\s*(?:semestre|semester)/i.test(lowerPrompt)) {
      const now = new Date();
      const semester = now.getMonth() < 6 ? 1 : 7;
      return { startDate: `${now.getFullYear()}-${String(semester).padStart(2, '0')}-01` };
    }

    // Default: últimos 3 meses
    console.log('[AI] extractPeriodFromPrompt returning default: { months: 3 }');
    return { months: 3 };
  }

  /**
   * Comisiones cobradas a clientes
   * Analiza los asientos con acttyp = 'LO' y prn = 36
   */
  private async handleCommissionsCharged(prompt: string = ''): Promise<AIResponse> {
    try {
      console.log('[AI] handleCommissionsCharged called with prompt:', prompt);
      // Extraer período del prompt
      const periodFilter = this.extractPeriodFromPrompt(prompt);
      console.log('[AI] periodFilter result:', periodFilter);
      const report = await gleService.getCommissionsCharged(periodFilter);

      if (!report || report.totalEntries === 0) {
        return {
          success: true,
          message: t('commissionsNoData'),
          results: [{
            type: 'text',
            title: t('commissionsCharged'),
            data: { content: t('commissionsNoData') }
          }],
          suggestions: [t('accounting'), t('globalAccountExample')],
        };
      }

      // Usar las fechas del API response (startDate y endDate del período solicitado)
      const formatDateRange = () => {
        if (report.startDate && report.endDate) {
          const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
          const start = new Date(report.startDate + 'T00:00:00');
          const end = new Date(report.endDate + 'T00:00:00');
          return `${start.toLocaleDateString('es-MX', options)} - ${end.toLocaleDateString('es-MX', options)}`;
        }
        return '';
      };

      // Mapeo de prefijos de cuenta a nombres legibles
      const ACCOUNT_NAMES: Record<string, string> = {
        '5205': 'Comisiones LC',
        '5204': 'Comisiones Garantías',
        '5203': 'Comisiones Cobranzas',
        '5290': 'Otros Ingresos',
        '5295': 'Recuperaciones',
        '2504': 'IVA por Pagar',
        '2509': 'Retenciones',
        '5590': 'Gastos Varios',
        '2590': 'Provisiones',
        '5291': 'Comisiones Varias',
      };

      const getAccountName = (account: string): string => {
        const prefix = account.substring(0, 4);
        return ACCOUNT_NAMES[prefix] || `Cta ${prefix}`;
      };

      // Calcular número de operaciones únicas
      const uniqueOperations = new Set(report.entries.map(e => e.reference)).size;

      // KPIs
      const kpis: KPIData[] = [
        {
          label: t('commissionsTotal'),
          value: this.formatCurrency(report.totalCommissions),
          color: 'green',
          icon: 'dollar',
        },
        {
          label: t('operations'),
          value: uniqueOperations,
          color: 'blue',
          icon: 'file',
        },
      ];

      // Add per-currency totals to KPIs
      report.byCurrency.forEach(cur => {
        kpis.push({
          label: `Total ${cur.currency}`,
          value: this.formatCurrency(cur.credits),
          color: cur.currency === 'USD' ? 'blue' : cur.currency === 'EUR' ? 'purple' : 'green',
          icon: 'dollar',
        });
      });

      // Chart data by currency (bar chart instead of pie for better visibility)
      const currencyChartData = report.byCurrency
        .filter(cur => cur.credits > 0)
        .map(cur => ({
          name: cur.currency,
          [t('total')]: Math.round(cur.credits),
        }));

      // Chart data by account type - group by account prefix with readable names
      const accountByType: Record<string, number> = {};
      report.entries.forEach(entry => {
        if (entry.activityType !== 'LO' && entry.type === 'C' && entry.amount > 0) {
          const accountName = getAccountName(entry.account);
          accountByType[accountName] = (accountByType[accountName] || 0) + entry.amount;
        }
      });
      const accountTypeChartData = Object.entries(accountByType)
        .map(([name, total]) => ({
          name,
          [t('total')]: Math.round(total),
        }))
        .sort((a, b) => (b[t('total')] as number) - (a[t('total')] as number))
        .slice(0, 8);

      // Timeline chart - group by month (using all entries with createdAt)
      const monthlyTotals: Record<string, { sortKey: string; total: number }> = {};
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      report.entries.forEach(entry => {
        // Solo considerar entradas de tipo crédito (ingresos por comisiones)
        if (entry.type === 'C' && entry.createdAt && entry.amount > 0) {
          const date = new Date(entry.createdAt);
          const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = { sortKey, total: 0 };
          }
          monthlyTotals[monthKey].total += entry.amount;
        }
      });

      const timelineData = Object.entries(monthlyTotals)
        .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
        .map(([month, data]) => ({
          name: month,
          [t('total')]: Math.round(data.total),
        }));

      // Calcular comparación mensual (mes actual vs mes anterior)
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

      let currentMonthTotal = 0;
      let prevMonthTotal = 0;

      report.entries.forEach(entry => {
        if (entry.type === 'C' && entry.createdAt && entry.amount > 0) {
          const date = new Date(entry.createdAt);
          const entryKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (entryKey === currentMonthKey) {
            currentMonthTotal += entry.amount;
          } else if (entryKey === prevMonthKey) {
            prevMonthTotal += entry.amount;
          }
        }
      });

      const monthChange = prevMonthTotal > 0
        ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)
        : null;

      // Chart data by operation (top 10)
      const operationChartData = report.byReference.slice(0, 10).map(ref => ({
        name: ref.reference,
        [t('total')]: Math.round(ref.amount),
      }));

      // Usar formatProductType que obtiene las descripciones de product_type_config
      const getProductTypeLabel = (pt: string) => this.formatProductType(pt);

      // Chart data by product type (aggregate by product type, sum all currencies)
      const productTypeTotals: Record<string, number> = {};
      (report.byProductType || []).forEach(pt => {
        const label = getProductTypeLabel(pt.productType);
        productTypeTotals[label] = (productTypeTotals[label] || 0) + pt.amount;
      });
      const productTypeChartData = Object.entries(productTypeTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([name, total]) => ({
          name,
          [t('total')]: Math.round(total),
        }));

      // Table by product type with currency breakdown
      const productTypeTableData = (report.byProductType || [])
        .sort((a, b) => b.amount - a.amount)
        .map(pt => ({
          [t('productType')]: getProductTypeLabel(pt.productType),
          [t('currency')]: pt.currency,
          [t('amount')]: this.formatCurrency(pt.amount),
          [t('commissionsCount')]: pt.count,
        }));

      // Table by operation with currency and product type (paginated in frontend)
      const tableData = report.byReference.map(ref => ({
        [t('reference')]: ref.reference,
        [t('productType')]: getProductTypeLabel(ref.productType),
        [t('currency')]: ref.currency,
        [t('amount')]: this.formatCurrency(ref.amount),
      }));

      // Detailed account table
      const accountTableData = Object.entries(accountByType)
        .sort(([, a], [, b]) => b - a)
        .map(([name, total]) => ({
          [t('account')]: name,
          [t('amount')]: this.formatCurrency(total),
        }));

      const dateRange = formatDateRange();

      // Nombres de meses para el mensaje
      const currentMonthName = monthNames[now.getMonth()];
      const prevMonthName = monthNames[prevMonth.getMonth()];

      // Mensaje de comparación mensual
      let monthComparisonText = '';
      if (currentMonthTotal > 0 || prevMonthTotal > 0) {
        const changeText = monthChange !== null
          ? ` (${Number(monthChange) >= 0 ? '+' : ''}${monthChange}%)`
          : '';
        monthComparisonText = `\n\n📊 ${currentMonthName}: ${this.formatCurrency(currentMonthTotal)} | ${prevMonthName}: ${this.formatCurrency(prevMonthTotal)}${changeText}`;
      }

      const summaryMessage = dateRange
        ? `📅 Período: ${dateRange}\n📋 ${uniqueOperations} operaciones | 💰 Total: ${this.formatCurrency(report.totalCommissions)}${monthComparisonText}`
        : `📋 ${uniqueOperations} operaciones | 💰 Total: ${this.formatCurrency(report.totalCommissions)}${monthComparisonText}`;

      // Datos para gráfico comparativo mensual
      const monthComparisonData = [];
      if (prevMonthTotal > 0) {
        monthComparisonData.push({ name: prevMonthName, [t('total')]: Math.round(prevMonthTotal) });
      }
      if (currentMonthTotal > 0) {
        monthComparisonData.push({ name: currentMonthName, [t('total')]: Math.round(currentMonthTotal) });
      }

      return {
        success: true,
        message: `${t('commissionsCharged')}: ${this.formatCurrency(report.totalCommissions)}`,
        results: [
          // Resumen del período
          {
            type: 'text',
            title: t('commissionsCharged'),
            data: { content: summaryMessage },
          },
          {
            type: 'kpi',
            title: t('commissionsTitle'),
            data: kpis,
          },
          // Comparación mes actual vs anterior
          ...(monthComparisonData.length > 0 ? [{
            type: 'chart' as const,
            title: `Comparación: ${prevMonthName} vs ${currentMonthName}`,
            data: monthComparisonData,
            chartConfig: {
              type: 'bar' as const,
              colors: ['#718096', '#38A169'],
            },
          }] : []),
          // Timeline chart (evolución mensual histórica)
          ...(timelineData.length > 1 ? [{
            type: 'chart' as const,
            title: `${t('monthlyTrend')} (${dateRange || 'Histórico'})`,
            data: timelineData,
            chartConfig: {
              type: 'bar' as const,
              colors: ['#38A169'],
            },
          }] : []),
          // Currency distribution (bar)
          ...(currencyChartData.length > 0 ? [{
            type: 'chart' as const,
            title: t('commissionsByCurrency'),
            data: currencyChartData,
            chartConfig: {
              type: 'bar' as const,
              colors: ['#3182CE', '#805AD5', '#38A169'],
            },
          }] : []),
          // By product type (horizontal bar)
          ...(productTypeChartData.length > 0 ? [{
            type: 'chart' as const,
            title: t('commissionsByProduct'),
            data: productTypeChartData,
            chartConfig: {
              type: 'horizontalBar' as const,
              colors: ['#DD6B20', '#D53F8C', '#38A169', '#3182CE', '#805AD5'],
            },
          }] : []),
          // Product type detail table
          ...(productTypeTableData.length > 0 ? [{
            type: 'table' as const,
            title: t('commissionsByProduct'),
            data: productTypeTableData,
          }] : []),
          // By account type (horizontal bar)
          ...(accountTypeChartData.length > 0 ? [{
            type: 'chart' as const,
            title: t('byAccount'),
            data: accountTypeChartData,
            chartConfig: {
              type: 'horizontalBar' as const,
              colors: ['#805AD5'],
            },
          }] : []),
          // Account detail table
          ...(accountTableData.length > 0 ? [{
            type: 'table' as const,
            title: t('byAccount'),
            data: accountTableData,
          }] : []),
          // By operation (horizontal bar for readability)
          ...(operationChartData.length > 0 ? [{
            type: 'chart' as const,
            title: t('commissionsByOperation'),
            data: operationChartData,
            chartConfig: {
              type: 'horizontalBar' as const,
              colors: ['#3182CE'],
            },
          }] : []),
          // Operations table
          {
            type: 'table',
            title: t('commissionsByOperation'),
            data: tableData,
          },
        ],
        suggestions: [
          'comisiones últimos 6 meses',
          'comisiones este año',
          'comisiones mes pasado',
          'comisiones este trimestre',
        ],
      };
    } catch (error) {
      console.error('Error fetching commissions:', error);
      return {
        success: false,
        message: t('accountingError'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: t('accountingServiceError') }
        }],
      };
    }
  }

  /**
   * Procesa datos mensuales de GLE
   */
  private processMonthlyGleData(data: any[]): any[] {
    const monthlyMap: Record<string, number> = {};

    data.forEach(item => {
      const month = item.month;
      if (!monthlyMap[month]) monthlyMap[month] = 0;
      monthlyMap[month] += Number(item.total) || 0;
    });

    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({
        mes: this.formatMonth(month),
        monto: total,
      }));
  }

  /**
   * Formatea moneda
   */
  private formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0';
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Intent no reconocido
   */
  private handleUnknown(prompt: string): AIResponse {
    const helpContent = `${t('canHelpWith')}\n\n` +
      `• **${t('expiringOperations')}** - "${t('expiringOpsExample')}"\n` +
      `• **${t('amountsSummary')}** - "${t('amountsSummaryExample')}"\n` +
      `• **${t('monthlyComparison')}** - "${t('monthlyCompExample')}"\n` +
      `• **${t('statistics')}** - "${t('statsExample')}"\n` +
      `• **${t('byType')}** - "${t('byTypeExample')}"\n` +
      `• **${t('listings')}** - "${t('listingsExample')}"\n` +
      `• **${t('swiftMessages')}** - "${t('swiftExample')}"\n` +
      `• **${t('alerts')}** - "${t('alertsExample')}"\n` +
      `• **${t('accounting')}** - "${t('accountingExample')}"`;

    return {
      success: true,
      message: t('suggestions'),
      results: [
        {
          type: 'text',
          title: t('suggestions'),
          data: { content: helpContent },
        },
      ],
      suggestions: [
        t('statistics'),
        t('expiringOperations'),
        t('accounting'),
        t('alerts'),
      ],
    };
  }

  // Utilidades
  private extractDays(prompt: string): number | null {
    const match = prompt.match(/(\d+)\s*(d[ií]as?|semanas?|mes(es)?)/i);
    if (match) {
      const num = parseInt(match[1]);
      if (match[2].startsWith('semana')) return num * 7;
      if (match[2].startsWith('mes')) return num * 30;
      return num;
    }
    return null;
  }

  /**
   * Formatea el tipo de producto usando la configuración de product_type_config
   * Usa el cache de configuraciones (debe haberse cargado previamente)
   */
  private formatProductType(type: string): string {
    if (this.productTypeConfigs && this.productTypeConfigs.length > 0) {
      const config = this.productTypeConfigs.find(c => c.productType === type);
      if (config) {
        return config.description || type;
      }
    }
    // Fallback: retorna el tipo sin formato si no hay config
    return type.replace(/_/g, ' ');
  }

  private formatDate(date?: string): string {
    if (!date) return '-';
    const locale = i18next.language?.startsWith('es') ? 'es-MX' : 'en-US';
    return new Date(date).toLocaleDateString(locale);
  }

  private formatMonth(month: string): string {
    const [year, m] = month.split('-');
    const monthKeys = ['monthJan', 'monthFeb', 'monthMar', 'monthApr', 'monthMay', 'monthJun',
                       'monthJul', 'monthAug', 'monthSep', 'monthOct', 'monthNov', 'monthDec'];
    const monthName = t(monthKeys[parseInt(m) - 1]);
    return `${monthName} ${year.slice(2)}`;
  }

  private formatWeek(date: string): string {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private isThisWeek(date: Date): boolean {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= weekStart && date < weekEnd;
  }

  private isNextMonth(date: Date): boolean {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    return date >= nextMonth && date < monthAfter;
  }

  /**
   * Execute a handler directly by its ID
   * Used by the guided AI interface
   */
  async executeHandler(handlerId: string, param?: string): Promise<AIResponse> {
    try {
      // Pre-cargar configuraciones de tipos de producto para formateo
      await this.loadProductTypeConfigs();

      // Build a synthetic prompt based on handler and parameter
      let syntheticPrompt = '';

      switch (handlerId) {
        case 'STATISTICS':
          return await this.handleStatistics('');
        case 'BY_PRODUCT_TYPE':
          return await this.handleByProductType('');
        case 'AMOUNT_SUMMARY':
          return await this.handleAmountSummary('');
        case 'LIST_OPERATIONS':
          syntheticPrompt = param ? `operaciones mayores a ${param}` : 'listar operaciones';
          return await this.handleListOperations(syntheticPrompt);
        case 'MONTHLY_COMPARISON':
          return await this.handleMonthlyComparison('');
        case 'EXPIRING_OPERATIONS':
          syntheticPrompt = param ? `vencen en ${param} dias` : 'vencen esta semana';
          return await this.handleExpiringOperations(syntheticPrompt);
        case 'ALERTS':
          return await this.handleAlerts('');
        case 'ACCOUNTING':
          return await this.handleAccounting('');
        case 'ACCOUNT_BALANCE':
          if (!param) {
            return {
              success: false,
              message: 'Se requiere un número de cuenta',
              results: [{
                type: 'error',
                title: 'Error',
                data: { message: 'Por favor ingresa un número de cuenta' }
              }],
            };
          }
          syntheticPrompt = `balance cuenta ${param}`;
          return await this.handleAccountBalance(syntheticPrompt);
        case 'OPERATION_BALANCE':
          if (!param) {
            return {
              success: false,
              message: 'Se requiere una referencia de operación',
              results: [{
                type: 'error',
                title: 'Error',
                data: { message: 'Por favor ingresa una referencia de operación' }
              }],
            };
          }
          syntheticPrompt = `balance operacion ${param}`;
          return await this.handleOperationBalance(syntheticPrompt);
        case 'GLOBAL_ACCOUNT_REPORT':
          return await this.handleGlobalAccountReport();
        case 'COMMISSIONS_CHARGED':
          // param puede contener el período: "3 meses", "este año", etc.
          return await this.handleCommissionsCharged(param || '');
        case 'SWIFT_MESSAGES':
          return await this.handleSwiftMessages('');
        case 'SWIFT_SEARCH':
          if (!param) {
            return {
              success: false,
              message: t('swiftSearchPrompt'),
              results: [{
                type: 'error',
                title: 'Error',
                data: { message: t('swiftSearchPrompt') }
              }],
            };
          }
          return await this.handleSwiftSearch(`buscar en swift ${param}`);
        case 'FREEFORM':
          // Para consultas de texto libre, usar processPrompt directamente
          if (param) {
            return await this.processPrompt(param);
          }
          return this.handleUnknown('');
        default:
          // Si no es un handler conocido, intentar procesarlo como consulta libre
          if (param) {
            return await this.processPrompt(param);
          }
          return {
            success: false,
            message: 'Handler no reconocido',
            results: [{
              type: 'error',
              title: 'Error',
              data: { message: `Handler desconocido: ${handlerId}` }
            }],
          };
      }
    } catch (error) {
      console.error('AI Assistant executeHandler error:', error);
      return {
        success: false,
        message: 'Error al procesar la solicitud',
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: error instanceof Error ? error.message : 'Error desconocido' }
        }],
      };
    }
  }
}

export const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
