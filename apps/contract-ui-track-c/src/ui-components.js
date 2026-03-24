const STATUS_CATALOG = {
  PUBLISHED: { className: 'status-published', label: 'Publicado' },
  EVALUATION: { className: 'status-evaluation', label: 'En evaluación' },
  AWARDED: { className: 'status-awarded', label: 'Adjudicado' },
  DRAFT: { className: 'status-draft', label: 'Borrador' },
  CANCELLED: { className: 'status-cancelled', label: 'Cancelado' }
};

const unknownStatusSeen = new Set();

function resolveStatusMeta(state, { logger = console } = {}) {
  const key = String(state || '').trim().toUpperCase();
  if (key && STATUS_CATALOG[key]) return STATUS_CATALOG[key];

  if (key && !unknownStatusSeen.has(key)) {
    unknownStatusSeen.add(key);
    if (logger && typeof logger.warn === 'function') {
      logger.warn(`[ui-status] Unknown status encountered: ${key}`);
    }
  }

  return { className: 'status-default', label: key || 'N/D', unknown: Boolean(key) };
}

function statusClass(state, options) {
  return resolveStatusMeta(state, options).className;
}

function statusLabel(state, options) {
  return resolveStatusMeta(state, options).label;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

module.exports = {
  STATUS_META: STATUS_CATALOG,
  resolveStatusMeta,
  statusClass,
  statusLabel,
  formatCurrency
};
