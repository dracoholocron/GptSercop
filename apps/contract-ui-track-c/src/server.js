const http = require('http');
const { URL } = require('url');
const { createTrackAClient } = require('./track-a-client');
const { htmlPage } = require('./ui-template');
const { parseAcceptLanguage } = require('./ui-config');

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

function buildCorrelationId() {
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCorrelationId(req) {
  const incoming = req.headers['x-correlation-id'];
  const value = Array.isArray(incoming) ? incoming[0] : incoming;
  return String(value || '').trim() || buildCorrelationId();
}

function sendJson(res, status, body, correlationId) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  if (correlationId) res.setHeader('x-correlation-id', correlationId);
  const payload = correlationId && body && typeof body === 'object' ? { correlationId, ...body } : body;
  res.end(JSON.stringify(payload));
}

function normalizeError(err) {
  const status = Number(err?.status) || 502;
  if (err?.payload && typeof err.payload === 'object') {
    return { status, payload: { type: err.payload.type || 'upstream_error', title: err.payload.title || String(err.message || 'Upstream error'), status } };
  }
  return {
    status,
    payload: {
      type: 'upstream_error',
      title: String(err?.message || 'Upstream error'),
      status,
    },
  };
}

function logEvent(level, event, extra = {}) {
  const line = JSON.stringify({ level, event, ...extra });
  if (level === 'error') console.error(line);
  else console.log(line);
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

function createServer({ trackAClient = createTrackAClient() } = {}) {
  return http.createServer(async (req, res) => {
    applySecurityHeaders(res);
    const correlationId = getCorrelationId(req);
    res.setHeader('x-correlation-id', correlationId);
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && ['/app/dashboard', '/app/processes', '/app/process-analysis', '/app/processes/new', '/app/contracts', '/app/contracts/detail', '/app/contracts/progress', '/app/contracts/payments', '/app/contracts/incidents', '/app/contracts/closure', '/app/cp/paa', '/app/cp/budget', '/app/cp/market', '/app/cp/risk', '/app/cp/assistant'].includes(url.pathname)) {
      const forcedLang = url.searchParams.get('lang');
      const headerLang = parseAcceptLanguage(req.headers['accept-language']);
      const locale = forcedLang || headerLang;
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(htmlPage({ initialRoute: url.pathname, locale }));
      logEvent('info', 'ui.rendered', { path: url.pathname, locale });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/v1/public/search') {
      try {
        const q = url.searchParams.get('q') || '';
        const payload = await trackAClient.search(q);
        logEvent('info', 'api.search.ok', { q, total: payload.total ?? null });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.search.error', { status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const processMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)$/);
    if (req.method === 'GET' && processMatch) {
      const processId = decodeURIComponent(processMatch[1]);
      try {
        const payload = await trackAClient.processDetail(processId);
        logEvent('info', 'api.process.detail.ok', { processId });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.process.detail.error', { processId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const summaryMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/gpt-analysis-summary$/);
    if (req.method === 'POST' && summaryMatch) {
      const processId = decodeURIComponent(summaryMatch[1]);
      try {
        const body = await readJson(req);
        const payload = await trackAClient.summary(processId, body);
        logEvent('info', 'api.process.summary.ok', { processId });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.process.summary.error', { processId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    if (req.method === 'POST' && url.pathname === '/v1/offers') {
      try {
        const body = await readJson(req);
        const payload = await trackAClient.submitOffer(body);
        logEvent('info', 'api.offer.submit.ok', { processId: payload.processId, offerId: payload.offerId });
        return sendJson(res, 201, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.offer.submit.error', { status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const offersMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/offers$/);
    if (req.method === 'GET' && offersMatch) {
      const processId = decodeURIComponent(offersMatch[1]);
      try {
        const payload = await trackAClient.listOffers(processId);
        logEvent('info', 'api.offer.list.ok', { processId, total: payload.items?.length ?? null });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.offer.list.error', { processId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const awardMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/award$/);
    if (req.method === 'POST' && awardMatch) {
      const processId = decodeURIComponent(awardMatch[1]);
      try {
        const body = await readJson(req);
        const payload = await trackAClient.award(processId, String(body.offerId ?? ''));
        logEvent('info', 'api.award.ok', { processId, offerId: body.offerId });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.award.error', { processId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    if (req.method === 'POST' && url.pathname === '/v1/contracts') {
      try {
        const body = await readJson(req);
        const payload = await trackAClient.createContract(String(body.processId ?? ''), String(body.offerId ?? ''));
        logEvent('info', 'api.contract.create.ok', { processId: body.processId, contractId: payload.contractId });
        return sendJson(res, 201, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.contract.create.error', { status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const contractsMatch = url.pathname.match(/^\/v1\/processes\/([^/]+)\/contracts$/);
    if (req.method === 'GET' && contractsMatch) {
      const processId = decodeURIComponent(contractsMatch[1]);
      try {
        const payload = await trackAClient.listContracts(processId);
        logEvent('info', 'api.contract.list.ok', { processId, total: payload.items?.length ?? null });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.contract.list.error', { processId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    if (req.method === 'POST' && url.pathname === '/v1/payments') {
      try {
        const body = await readJson(req);
        const payload = await trackAClient.registerPayment(String(body.contractId ?? ''), Number(body.amountUsd ?? 0));
        logEvent('info', 'api.payment.register.ok', { contractId: body.contractId, paymentId: payload.paymentId });
        return sendJson(res, 201, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.payment.register.error', { status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    const paymentsMatch = url.pathname.match(/^\/v1\/contracts\/([^/]+)\/payments$/);
    if (req.method === 'GET' && paymentsMatch) {
      const contractId = decodeURIComponent(paymentsMatch[1]);
      try {
        const payload = await trackAClient.listPayments(contractId);
        logEvent('info', 'api.payment.list.ok', { contractId, total: payload.items?.length ?? null });
        return sendJson(res, 200, payload, correlationId);
      } catch (err) {
        const e = normalizeError(err);
        logEvent('error', 'api.payment.list.error', { contractId, status: e.status, message: e.payload.title });
        return sendJson(res, e.status, e.payload, correlationId);
      }
    }

    if (req.method === 'POST' && url.pathname === '/v1/ai-help') {
      const body = await readJson(req).catch(() => ({}));
      logEvent('info', 'api.ai-help.ok', { processId: body.processId || null, section: body.section || 'general' });
      return sendJson(res, 200, {
        state: 'success',
        processId: body.processId || null,
        section: body.section || 'general',
        message: 'Sugerencia generada: valida requisitos habilitantes y cronograma contractual.',
        recommendations: [
          'Confirmar que todos los anexos tengan versión vigente.',
          'Priorizar controles de trazabilidad para auditoría.',
        ],
      }, correlationId);
    }

    logEvent('error', 'api.route.not_found', { method: req.method, path: url.pathname });
    return sendJson(res, 404, { type: 'not_found', title: 'Route not found', status: 404 }, correlationId);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  createServer().listen(port, () => console.log(`contract-ui-track-c listening on :${port}`));
}

module.exports = { createServer, normalizeError };
