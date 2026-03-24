/**
 * AI Assistant Categories Configuration
 * Defines the guided navigation structure for the AI assistant
 */

import type { IconType } from 'react-icons/lib';
import {
  FiPieChart,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiBook,
  FiMail,
  FiBarChart2,
  FiList,
  FiAlertTriangle,
  FiSearch,
  FiPackage,
  FiCalendar,
} from 'react-icons/fi';

export interface AISelectOption {
  value: string;
  labelKey: string;
}

export interface AIInputConfig {
  labelKey: string;
  placeholderKey?: string;
  exampleKey?: string;
  validation?: RegExp;
  type?: 'text' | 'select';  // Default: 'text'
  selectOptions?: AISelectOption[];
}

export interface AIOption {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: IconType;
  requiresInput?: boolean;
  inputConfig?: AIInputConfig;
  handler: string;
  searchKeywords?: string[]; // Additional keywords for search
}

export interface AICategory {
  id: string;
  icon: IconType;
  titleKey: string;
  descriptionKey: string;
  color: string;
  options: AIOption[];
}

export interface AIQuickAction {
  id: string;
  labelKey: string;
  handler: string;
  params?: string;
}

export const AI_CATEGORIES: AICategory[] = [
  {
    id: 'statistics',
    icon: FiPieChart,
    titleKey: 'ai.category.statistics',
    descriptionKey: 'ai.category.statisticsDesc',
    color: 'blue',
    options: [
      {
        id: 'general',
        titleKey: 'ai.option.generalStats',
        descriptionKey: 'ai.option.generalStatsDesc',
        icon: FiPieChart,
        handler: 'STATISTICS',
        searchKeywords: ['dashboard', 'resumen', 'general', 'indicadores', 'kpi'],
      },
      {
        id: 'byType',
        titleKey: 'ai.option.byProductType',
        descriptionKey: 'ai.option.byProductTypeDesc',
        icon: FiBarChart2,
        handler: 'BY_PRODUCT_TYPE',
        searchKeywords: ['tipo', 'producto', 'lc', 'garantia', 'cobranza', 'distribution'],
      },
    ],
  },
  {
    id: 'amounts',
    icon: FiDollarSign,
    titleKey: 'ai.category.amounts',
    descriptionKey: 'ai.category.amountsDesc',
    color: 'green',
    options: [
      {
        id: 'summary',
        titleKey: 'ai.option.amountSummary',
        descriptionKey: 'ai.option.amountSummaryDesc',
        icon: FiDollarSign,
        handler: 'AMOUNT_SUMMARY',
        searchKeywords: ['monto', 'total', 'dinero', 'volumen', 'money', 'amount'],
      },
      {
        id: 'list',
        titleKey: 'ai.option.listOperations',
        descriptionKey: 'ai.option.listOperationsDesc',
        icon: FiList,
        handler: 'LIST_OPERATIONS',
        requiresInput: true,
        inputConfig: {
          labelKey: 'ai.input.minAmount',
          placeholderKey: '100000',
        },
        searchKeywords: ['listar', 'operaciones', 'filtrar', 'mayor', 'menor'],
      },
    ],
  },
  {
    id: 'trends',
    icon: FiTrendingUp,
    titleKey: 'ai.category.trends',
    descriptionKey: 'ai.category.trendsDesc',
    color: 'purple',
    options: [
      {
        id: 'monthly',
        titleKey: 'ai.option.monthlyComparison',
        descriptionKey: 'ai.option.monthlyComparisonDesc',
        icon: FiTrendingUp,
        handler: 'MONTHLY_COMPARISON',
        searchKeywords: ['mensual', 'mes', 'tendencia', 'comparar', 'trend', 'monthly'],
      },
    ],
  },
  {
    id: 'expiring',
    icon: FiClock,
    titleKey: 'ai.category.expiring',
    descriptionKey: 'ai.category.expiringDesc',
    color: 'orange',
    options: [
      {
        id: 'thisWeek',
        titleKey: 'ai.option.expiringWeek',
        descriptionKey: 'ai.option.expiringWeekDesc',
        icon: FiCalendar,
        handler: 'EXPIRING_OPERATIONS',
        searchKeywords: ['vencer', 'vencimiento', 'semana', 'proximo', 'expiring', 'due'],
      },
      {
        id: 'alerts',
        titleKey: 'ai.option.alerts',
        descriptionKey: 'ai.option.alertsDesc',
        icon: FiAlertTriangle,
        handler: 'ALERTS',
        searchKeywords: ['alerta', 'urgente', 'atencion', 'critico', 'alert', 'warning'],
      },
    ],
  },
  {
    id: 'accounting',
    icon: FiBook,
    titleKey: 'ai.category.accounting',
    descriptionKey: 'ai.category.accountingDesc',
    color: 'teal',
    options: [
      {
        id: 'summary',
        titleKey: 'ai.option.accountingSummary',
        descriptionKey: 'ai.option.accountingSummaryDesc',
        icon: FiBook,
        handler: 'ACCOUNTING',
        searchKeywords: ['contabilidad', 'debito', 'credito', 'gle', 'ledger', 'accounting'],
      },
      {
        id: 'byAccount',
        titleKey: 'ai.option.accountBalance',
        descriptionKey: 'ai.option.accountBalanceDesc',
        icon: FiSearch,
        handler: 'ACCOUNT_BALANCE',
        requiresInput: true,
        inputConfig: {
          labelKey: 'ai.input.accountNumber',
          placeholderKey: '1101',
        },
        searchKeywords: ['cuenta', 'balance', 'saldo', 'movimientos', 'account'],
      },
      {
        id: 'byOperation',
        titleKey: 'ai.option.operationBalance',
        descriptionKey: 'ai.option.operationBalanceDesc',
        icon: FiPackage,
        handler: 'OPERATION_BALANCE',
        requiresInput: true,
        inputConfig: {
          labelKey: 'ai.input.operationRef',
          placeholderKey: 'B145061',
          exampleKey: 'ai.input.operationRefExample',
        },
        searchKeywords: ['operacion', 'referencia', 'asientos', 'contable', 'operation', 'reference'],
      },
      {
        id: 'globalReport',
        titleKey: 'ai.option.globalAccountReport',
        descriptionKey: 'ai.option.globalAccountReportDesc',
        icon: FiBarChart2,
        handler: 'GLOBAL_ACCOUNT_REPORT',
        searchKeywords: ['global', 'todas', 'cuentas', 'informe', 'reporte', 'saldos', 'all', 'accounts', 'report'],
      },
      {
        id: 'commissions',
        titleKey: 'ai.option.commissionsCharged',
        descriptionKey: 'ai.option.commissionsChargedDesc',
        icon: FiDollarSign,
        handler: 'COMMISSIONS_CHARGED',
        requiresInput: true,
        inputConfig: {
          labelKey: 'ai.input.period',
          type: 'select',
          selectOptions: [
            { value: 'últimos 3 meses', labelKey: 'ai.period.last3Months' },
            { value: 'últimos 6 meses', labelKey: 'ai.period.last6Months' },
            { value: 'este mes', labelKey: 'ai.period.thisMonth' },
            { value: 'mes pasado', labelKey: 'ai.period.lastMonth' },
            { value: 'este trimestre', labelKey: 'ai.period.thisQuarter' },
            { value: 'este año', labelKey: 'ai.period.thisYear' },
            { value: 'año pasado', labelKey: 'ai.period.lastYear' },
          ],
        },
        searchKeywords: ['comision', 'comisiones', 'cobradas', 'cliente', 'commission', 'fee', 'charges', 'LO'],
      },
    ],
  },
  {
    id: 'swift',
    icon: FiMail,
    titleKey: 'ai.category.swift',
    descriptionKey: 'ai.category.swiftDesc',
    color: 'cyan',
    options: [
      {
        id: 'messages',
        titleKey: 'ai.option.swiftMessages',
        descriptionKey: 'ai.option.swiftMessagesDesc',
        icon: FiMail,
        handler: 'SWIFT_MESSAGES',
        searchKeywords: ['swift', 'mensaje', 'mt700', 'mt707', 'message'],
      },
    ],
  },
];

export const AI_QUICK_ACTIONS: AIQuickAction[] = [
  {
    id: 'thisWeek',
    labelKey: 'ai.quick.thisWeek',
    handler: 'EXPIRING_OPERATIONS',
    params: '7',
  },
  {
    id: 'activeLCs',
    labelKey: 'ai.quick.activeLCs',
    handler: 'STATISTICS',
  },
  {
    id: 'pendingAlerts',
    labelKey: 'ai.quick.pendingAlerts',
    handler: 'ALERTS',
  },
];

/**
 * Search all options across all categories
 */
export function searchOptions(query: string): Array<{ option: AIOption; category: AICategory }> {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: Array<{ option: AIOption; category: AICategory; score: number }> = [];

  for (const category of AI_CATEGORIES) {
    for (const option of category.options) {
      let score = 0;

      // Check title and description keys (we'll use the actual translated text in the component)
      const titleKey = option.titleKey.toLowerCase();
      const descKey = option.descriptionKey.toLowerCase();

      if (titleKey.includes(normalizedQuery)) score += 10;
      if (descKey.includes(normalizedQuery)) score += 5;

      // Check search keywords
      if (option.searchKeywords) {
        for (const keyword of option.searchKeywords) {
          if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) {
            score += 8;
          }
        }
      }

      // Check category title
      if (category.titleKey.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }

      if (score > 0) {
        results.push({ option, category, score });
      }
    }
  }

  // Sort by score descending
  return results
    .sort((a, b) => b.score - a.score)
    .map(({ option, category }) => ({ option, category }));
}

/**
 * Get all options as a flat list
 */
export function getAllOptions(): Array<{ option: AIOption; category: AICategory }> {
  const results: Array<{ option: AIOption; category: AICategory }> = [];

  for (const category of AI_CATEGORIES) {
    for (const option of category.options) {
      results.push({ option, category });
    }
  }

  return results;
}
