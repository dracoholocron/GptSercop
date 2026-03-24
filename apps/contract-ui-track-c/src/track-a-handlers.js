const http = require('http');
const { URL } = require('url');
const { searchProcesses, getProcessById, createOffer, listOffersByProcess, awardProcess, createContractFromAward, listContractsByProcess, registerPayment, listPaymentsByContract, buildGptSummary } = require('./data');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function createTrackAServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/v1/public/search') {
      const q = url.searchParams.get('q') || '';
      const items = searchProcesses(q);
      return sendJson(res, 200, { total: items.length, items });
    }

    const processMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)$/);
    if (req.method === 'GET' && processMatch) {
      const processId = decodeURIComponent(processMatch[1]);
      const process = getProcessById(processId);
      if (!process) return sendJson(res, 404, { type: 'not_found', title: 'Process not found', status: 404 });
      return sendJson(res, 200, process);
    }

    const summaryMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/gpt-analysis-summary$/);
    if (req.method === 'POST' && summaryMatch) {
      const processId = decodeURIComponent(summaryMatch[1]);
      const process = getProcessById(processId);
      if (!process) return sendJson(res, 404, { type: 'not_found', title: 'Process not found', status: 404 });
      await readJson(req);
      return sendJson(res, 200, buildGptSummary(process));
    }

    if (req.method === 'POST' && url.pathname === '/v1/offers') {
      try {
        const body = await readJson(req);
        return sendJson(res, 201, createOffer(body));
      } catch (err) {
        return sendJson(res, err.status || 400, { type: 'validation_error', title: err.message, status: err.status || 400 });
      }
    }

    const offersMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/offers$/);
    if (req.method === 'GET' && offersMatch) {
      const processId = decodeURIComponent(offersMatch[1]);
      return sendJson(res, 200, { items: listOffersByProcess(processId) });
    }

    const awardMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/award$/);
    if (req.method === 'POST' && awardMatch) {
      try {
        const processId = decodeURIComponent(awardMatch[1]);
        const body = await readJson(req);
        return sendJson(res, 200, awardProcess(processId, String(body.offerId ?? '')));
      } catch (err) {
        return sendJson(res, err.status || 400, { type: 'validation_error', title: err.message, status: err.status || 400 });
      }
    }

    const contractsByProcessMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/contracts$/);
    if (req.method === 'GET' && contractsByProcessMatch) {
      const processId = decodeURIComponent(contractsByProcessMatch[1]);
      return sendJson(res, 200, { items: listContractsByProcess(processId) });
    }

    const contractsMatch = url.pathname.match(/^\/v1\/contracts$/);
    if (req.method === 'POST' && contractsMatch) {
      try {
        const body = await readJson(req);
        return sendJson(res, 201, createContractFromAward(String(body.processId ?? ''), String(body.offerId ?? '')));
      } catch (err) {
        return sendJson(res, err.status || 400, { type: 'validation_error', title: err.message, status: err.status || 400 });
      }
    }

    const paymentsMatch = url.pathname.match(/^\/v1\/payments$/);
    if (req.method === 'POST' && paymentsMatch) {
      try {
        const body = await readJson(req);
        return sendJson(res, 201, registerPayment(body));
      } catch (err) {
        return sendJson(res, err.status || 400, { type: 'validation_error', title: err.message, status: err.status || 400 });
      }
    }

    const contractPaymentsMatch = url.pathname.match(/^\/v1\/contracts\/([^/]+)\/payments$/);
    if (req.method === 'GET' && contractPaymentsMatch) {
      const contractId = decodeURIComponent(contractPaymentsMatch[1]);
      return sendJson(res, 200, { items: listPaymentsByContract(contractId) });
    }

    return sendJson(res, 404, { type: 'not_found', title: 'Route not found', status: 404 });
  });
}

module.exports = { createTrackAServer };
