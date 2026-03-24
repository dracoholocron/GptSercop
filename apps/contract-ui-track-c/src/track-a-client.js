const { assertPublicSearchResult, assertProcess, assertGptSummary } = require('./contract-schemas');
const { searchProcesses, getProcessById, buildGptSummary } = require('./data');

function createTrackAClient({ baseUrl = process.env.TRACK_A_API_BASE_URL } = {}) {
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json();
    if (!response.ok) {
      const err = new Error(payload.title || payload.error || 'track_a_request_failed');
      err.status = response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  if (baseUrl) {
    return {
      async search(q) {
        return assertPublicSearchResult(await request(`/v1/public/search?q=${encodeURIComponent(q)}`));
      },
      async processDetail(processId) {
        return assertProcess(await request(`/v1/processes/${encodeURIComponent(processId)}`));
      },
      async summary(processId, input = { mode: 'executive' }) {
        return assertGptSummary(await request(`/v1/processes/${encodeURIComponent(processId)}/gpt-analysis-summary`, { method: 'POST', body: input }));
      },
      async submitOffer(input) {
        return request('/v1/offers', { method: 'POST', body: input });
      },
      async listOffers(processId) {
        return request(`/v1/processes/${encodeURIComponent(processId)}/offers`);
      },
      async award(processId, offerId) {
        return request(`/v1/processes/${encodeURIComponent(processId)}/award`, { method: 'POST', body: { offerId } });
      },
      async createContract(processId, offerId) {
        return request('/v1/contracts', { method: 'POST', body: { processId, offerId } });
      },
      async listContracts(processId) {
        return request(`/v1/processes/${encodeURIComponent(processId)}/contracts`);
      },
      async registerPayment(contractId, amountUsd) {
        return request('/v1/payments', { method: 'POST', body: { contractId, amountUsd } });
      },
      async listPayments(contractId) {
        return request(`/v1/contracts/${encodeURIComponent(contractId)}/payments`);
      },
    };
  }

  return {
    async search(q) {
      return assertPublicSearchResult({ total: searchProcesses(q).length, items: searchProcesses(q) });
    },
    async processDetail(processId) {
      const process = getProcessById(processId);
      if (!process) {
        const err = new Error('Process not found');
        err.status = 404;
        throw err;
      }
      return assertProcess(process);
    },
    async summary(processId) {
      const process = getProcessById(processId);
      if (!process) {
        const err = new Error('Process not found');
        err.status = 404;
        throw err;
      }
      return assertGptSummary(buildGptSummary(process));
    },
    async submitOffer() {
      throw new Error('submitOffer requires TRACK_A_API_BASE_URL');
    },
    async listOffers() {
      throw new Error('listOffers requires TRACK_A_API_BASE_URL');
    },
    async award() {
      throw new Error('award requires TRACK_A_API_BASE_URL');
    },
    async createContract() {
      throw new Error('createContract requires TRACK_A_API_BASE_URL');
    },
    async listContracts() {
      throw new Error('listContracts requires TRACK_A_API_BASE_URL');
    },
    async registerPayment() {
      throw new Error('registerPayment requires TRACK_A_API_BASE_URL');
    },
    async listPayments() {
      throw new Error('listPayments requires TRACK_A_API_BASE_URL');
    },
  };
}

module.exports = { createTrackAClient };
