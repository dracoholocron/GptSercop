const { UI_I18N_ES_EC } = require('./ui-i18n-es-ec');
const { UI_I18N_EN_US } = require('./ui-i18n-en-us');

const I18N_BY_LOCALE = {
  'es-ec': UI_I18N_ES_EC,
  'en-us': UI_I18N_EN_US
};

function normalizeLocale(input) {
  return String(input || '').trim().toLowerCase().replace('_', '-');
}

function resolveLocale(input) {
  const normalized = normalizeLocale(input);
  if (I18N_BY_LOCALE[normalized]) return normalized;
  if (normalized.startsWith('es')) return 'es-ec';
  if (normalized.startsWith('en')) return 'en-us';
  return 'es-ec';
}

function parseAcceptLanguage(header) {
  const raw = String(header || '').trim();
  if (!raw) return '';
  return raw.split(',')[0].split(';')[0].trim();
}

function getUiConfig(localeInput) {
  const locale = resolveLocale(localeInput || process.env.UI_LOCALE || process.env.LOCALE || 'es-EC');
  const i18n = I18N_BY_LOCALE[locale];
  const isEn = locale === 'en-us';

  const routes = {
    '/app/dashboard': { section: 'screenDashboard', title: i18n.nav.dashboard, subtitle: isEn ? 'Executive view' : 'Vista ejecutiva' },
    '/app/processes': { section: 'screenProcesses', title: i18n.nav.processes, subtitle: isEn ? 'List and selection' : 'Listado y selección' },
    '/app/process-analysis': { section: 'screenDetail', title: isEn ? 'Process analysis' : 'Análisis de proceso', subtitle: 'Detalle + GPT' },
    '/app/processes/new': { section: 'screenForm', title: i18n.nav.create, subtitle: isEn ? 'Form with validations' : 'Formulario con validaciones' },
    '/app/contracts': { section: 'screenContractsList', title: i18n.sections.contractsList, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/contracts/detail': { section: 'screenContractDetail', title: i18n.sections.contractDetail, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/contracts/progress': { section: 'screenContractProgress', title: i18n.sections.contractProgress, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/contracts/payments': { section: 'screenContractPayments', title: i18n.sections.contractPayments, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/contracts/incidents': { section: 'screenContractIncidents', title: i18n.sections.contractIncidents, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/contracts/closure': { section: 'screenContractClosure', title: i18n.sections.contractClosure, subtitle: isEn ? 'Execution module' : 'Módulo de ejecución' },
    '/app/cp/paa': { section: 'screenCpPaa', title: i18n.sections.cpPaa, subtitle: isEn ? 'Phase 1 execution' : 'Ejecución Fase 1' },
    '/app/cp/budget': { section: 'screenCpBudget', title: i18n.sections.cpBudget, subtitle: isEn ? 'Phase 1 execution' : 'Ejecución Fase 1' },
    '/app/cp/market': { section: 'screenCpMarket', title: i18n.sections.cpMarket, subtitle: isEn ? 'Phase 1 execution' : 'Ejecución Fase 1' },
    '/app/cp/risk': { section: 'screenCpRisk', title: i18n.sections.cpRisk, subtitle: isEn ? 'Phase 1 execution' : 'Ejecución Fase 1' },
    '/app/cp/assistant': { section: 'screenCpAssistant', title: i18n.sections.cpAssistant, subtitle: isEn ? 'Phase 1 execution' : 'Ejecución Fase 1' },
  };

  return {
    locale,
    i18n,
    routes,
    uiText: i18n.runtime,
    formText: i18n.form
  };
}

module.exports = { getUiConfig, resolveLocale, parseAcceptLanguage };
