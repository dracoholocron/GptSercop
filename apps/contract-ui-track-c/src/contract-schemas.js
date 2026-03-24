function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertPublicSearchResult(payload) {
  if (!isObject(payload)) throw new Error('public_search_invalid_payload');
  if (typeof payload.total !== 'number') throw new Error('public_search_total_required');
  if (!Array.isArray(payload.items)) throw new Error('public_search_items_required');
  for (const item of payload.items) {
    assertProcess(item, { allowPartial: true });
  }
  return payload;
}

function assertProcess(payload, { allowPartial = false } = {}) {
  if (!isObject(payload)) throw new Error('process_invalid_payload');
  if (typeof payload.processId !== 'string' || payload.processId.length === 0) throw new Error('process_id_required');
  if (!allowPartial && (typeof payload.state !== 'string' || payload.state.length === 0)) throw new Error('process_state_required');
  return payload;
}

function assertGptSummary(payload) {
  if (!isObject(payload)) throw new Error('summary_invalid_payload');
  if (typeof payload.processId !== 'string' || payload.processId.length === 0) throw new Error('summary_process_id_required');
  if (typeof payload.executiveSummary !== 'string' || payload.executiveSummary.length === 0) throw new Error('summary_executive_required');
  return payload;
}

module.exports = {
  assertPublicSearchResult,
  assertProcess,
  assertGptSummary
};
