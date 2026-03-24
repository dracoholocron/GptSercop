const processes = [
  { processId: 'SERCOP-2026-LIC-0001', state: 'PUBLISHED', type: 'LICITACION', title: 'Adquisición de equipos biomédicos', entity: 'Hospital General Quito Sur', amountUsd: 312500, createdAt: '2026-03-01', deadline: '2026-04-05' },
  { processId: 'SERCOP-2026-COT-0177', state: 'EVALUATION', type: 'COTIZACION', title: 'Servicio de mantenimiento de flota institucional', entity: 'Gobierno Provincial de Pichincha', amountUsd: 89500, createdAt: '2026-02-22', deadline: '2026-03-28' },
  { processId: 'SERCOP-2026-REP-0412', state: 'AWARDED', type: 'REGIMEN_ESPECIAL', title: 'Reposición de mobiliario escolar', entity: 'Distrito Educación 17D06', amountUsd: 154200, createdAt: '2026-01-15', deadline: '2026-03-22' },
];

const offers = [];
const contracts = [];
const payments = [];

function searchProcesses(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return processes.filter((p) => [p.processId, p.title, p.entity, p.state, p.type].join(' ').toLowerCase().includes(q));
}

function getProcessById(processId) {
  return processes.find((p) => p.processId === processId) || null;
}

function createOffer(input = {}) {
  const processId = String(input.processId ?? '').trim();
  const supplierId = String(input.supplierId ?? '').trim();
  const amountUsd = Number(input.amountUsd ?? 0);
  const process = getProcessById(processId);
  if (!process) { const err = new Error('Process not found'); err.status = 404; throw err; }
  if (!supplierId || !Number.isFinite(amountUsd) || amountUsd <= 0) { const err = new Error('Invalid offer payload'); err.status = 400; throw err; }

  const offer = { offerId: `OFF-${String(offers.length + 1).padStart(4, '0')}`, processId, supplierId, amountUsd, status: 'SUBMITTED', createdAt: new Date().toISOString() };
  offers.push(offer);
  if (process.state === 'PUBLISHED') process.state = 'EVALUATION';
  return offer;
}

function listOffersByProcess(processId) {
  return offers.filter((o) => o.processId === processId);
}

function awardProcess(processId, offerId) {
  const process = getProcessById(processId);
  if (!process) { const err = new Error('Process not found'); err.status = 404; throw err; }
  const offer = offers.find((o) => o.offerId === offerId && o.processId === processId);
  if (!offer) { const err = new Error('Offer not found'); err.status = 404; throw err; }
  process.state = 'AWARDED';
  offer.status = 'AWARDED';
  return { processId, offerId, awardedAt: new Date().toISOString(), state: process.state };
}

function createContractFromAward(processId, offerId) {
  const process = getProcessById(processId);
  if (!process) { const err = new Error('Process not found'); err.status = 404; throw err; }
  if (process.state !== 'AWARDED') { const err = new Error('Process must be AWARDED first'); err.status = 409; throw err; }

  const offer = offers.find((o) => o.offerId === offerId && o.processId === processId);
  if (!offer) { const err = new Error('Offer not found'); err.status = 404; throw err; }

  const existing = contracts.find((c) => c.processId === processId);
  if (existing) return existing;

  const contract = {
    contractId: `CON-${String(contracts.length + 1).padStart(4, '0')}`,
    processId,
    supplierId: offer.supplierId,
    amountUsd: offer.amountUsd,
    status: 'SIGNED',
    createdAt: new Date().toISOString(),
  };
  contracts.push(contract);
  return contract;
}

function registerPayment(input = {}) {
  const contractId = String(input.contractId ?? '').trim();
  const amountUsd = Number(input.amountUsd ?? 0);
  const contract = contracts.find((c) => c.contractId === contractId);
  if (!contract) { const err = new Error('Contract not found'); err.status = 404; throw err; }
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) { const err = new Error('Invalid payment payload'); err.status = 400; throw err; }

  const payment = {
    paymentId: `PAY-${String(payments.length + 1).padStart(4, '0')}`,
    contractId,
    amountUsd,
    status: 'REGISTERED',
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);
  return payment;
}

function listContractsByProcess(processId) {
  return contracts.filter((c) => c.processId === processId);
}

function listPaymentsByContract(contractId) {
  return payments.filter((p) => p.contractId === contractId);
}

function buildGptSummary(process) {
  if (!process) return null;
  const risk = process.amountUsd > 200000 ? 'MEDIUM' : 'LOW';
  const recommendations = [
    'Verificar consistencia de cronograma y hitos de publicación.',
    'Validar trazabilidad documental para soporte de auditoría.',
    process.state === 'EVALUATION' ? 'Asegurar matriz de evaluación alineada a criterios del pliego.' : 'Confirmar cumplimiento de requisitos habilitantes.',
  ];
  return { processId: process.processId, confidence: 0.86, riskLevel: risk, executiveSummary: `Proceso ${process.processId} en estado ${process.state}. Monto estimado USD ${process.amountUsd}.`, recommendations };
}

module.exports = {
  searchProcesses,
  getProcessById,
  createOffer,
  listOffersByProcess,
  awardProcess,
  createContractFromAward,
  listContractsByProcess,
  registerPayment,
  listPaymentsByContract,
  buildGptSummary,
};
