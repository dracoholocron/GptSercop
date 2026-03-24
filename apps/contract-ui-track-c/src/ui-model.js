const { statusLabel } = require('./ui-components');

function mapSearchResponse(apiResponse) {
  const items = Array.isArray(apiResponse?.items) ? apiResponse.items : [];
  return items.map((item) => ({
    id: item.processId,
    title: item.title || item.processId,
    badge: item.state || 'UNKNOWN',
    badgeLabel: statusLabel(item.state),
    entity: item.entity || 'Entidad no informada'
  }));
}

function formatSummary(summary) {
  if (!summary?.executiveSummary) return 'No hay análisis disponible.';
  const confidence = Number.isFinite(summary.confidence) ? `${(summary.confidence * 100).toFixed(0)}%` : 'N/D';
  return `${summary.executiveSummary}\nRiesgo: ${summary.riskLevel || 'N/D'}\nConfianza: ${confidence}`;
}

module.exports = { mapSearchResponse, formatSummary };
