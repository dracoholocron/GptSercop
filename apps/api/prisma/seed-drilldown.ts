/**
 * seed-drilldown.ts
 *
 * Creates rich, depth-per-entity and depth-per-provider data for all drill-down
 * pages in the analytics module.
 *
 * Run: npm run seed:drilldown --workspace=api
 *
 * Safe to run multiple times – uses findFirst + upsert patterns.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertEntity(code: string, name: string, orgType: string) {
  const existing = await prisma.entity.findFirst({ where: { code } });
  if (existing) return existing;
  return prisma.entity.create({ data: { code, name, organizationType: orgType } });
}

async function upsertProvider(identifier: string, name: string, province: string) {
  const existing = await prisma.provider.findFirst({ where: { identifier } });
  if (existing) return existing;
  return prisma.provider.create({
    data: {
      identifier,
      name,
      legalName: name,
      tradeName: name.split(' ')[0],
      status: 'active',
      province,
      canton: 'Capital',
    },
  });
}

async function upsertProcurementPlan(entityId: string, year: number, _title: string) {
  const existing = await prisma.procurementPlan.findFirst({ where: { entityId, year } });
  if (existing) return existing;
  return prisma.procurementPlan.create({
    data: { entityId, year, status: 'approved', totalAmount: 5_000_000 },
  });
}

async function upsertTender(
  code: string,
  title: string,
  procurementPlanId: string,
  processType: string,
  referenceAmount: number,
  status: string,
) {
  const existing = await prisma.tender.findFirst({ where: { code } });
  if (existing) return existing;
  return prisma.tender.create({
    data: {
      code,
      title,
      procurementPlanId,
      processType,
      estimatedAmount: referenceAmount,
      status,
      publishedAt: new Date(Date.now() - Math.random() * 180 * 86400_000),
      bidsDeadlineAt: new Date(Date.now() + 30 * 86400_000),
    },
  });
}

async function upsertContract(
  contractNo: string,
  tenderId: string,
  providerId: string,
  amount: number,
  status: string,
) {
  const existing = await prisma.contract.findFirst({ where: { contractNo } });
  if (existing) return existing;
  return prisma.contract.create({
    data: {
      contractNo,
      tenderId,
      providerId,
      amount,
      status,
      signedAt: new Date(Date.now() - Math.random() * 90 * 86400_000),
    },
  });
}

async function upsertBid(tenderId: string, providerId: string, amount: number, _rank: number) {
  const existing = await prisma.bid.findFirst({ where: { tenderId, providerId } });
  if (existing) return existing;
  return prisma.bid.create({
    data: { tenderId, providerId, amount, status: 'submitted', submittedAt: new Date() },
  });
}

async function main() {
  console.log('🌱 Seeding drill-down data...');

  // ─── ENTITIES ────────────────────────────────────────────────────────────────
  const gadQuito = await upsertEntity('GAD-QUITO-01', 'GAD Quito Metropolitano', 'municipio');
  const minSalud = await upsertEntity('MIN-SALUD-01', 'Ministerio de Salud Pública', 'ministerio');
  const senagua = await upsertEntity('SENAGUA-01', 'Secretaría Nacional del Agua', 'secretaria');
  const petroecuador = await upsertEntity('PETRO-01', 'Petroecuador EP', 'empresa_publica');
  const hospitalGeneral = await upsertEntity('HOSP-GEN-01', 'Hospital General de las Fuerzas Armadas', 'hospital');

  console.log('✅ 5 entities created/found');

  // ─── PROVIDERS ───────────────────────────────────────────────────────────────
  const techCorp = await upsertProvider('1790000100001', 'TechCorp Ecuador S.A.', 'Pichincha');
  const constructora = await upsertProvider('1790000200001', 'ConstructoraXYZ Cía. Ltda.', 'Guayas');
  const medSur = await upsertProvider('1790000300001', 'MedSur Suministros Médicos', 'Azuay');
  const newCompany = await upsertProvider('1790000400001', 'NewTech Solutions S.A.S.', 'Pichincha');
  const grupoABC = await upsertProvider('1790000500001', 'Grupo ABC Construcciones', 'Pichincha');
  const siemprePierde = await upsertProvider('1790000600001', 'Siempre Pierde Corp.', 'Manabí');

  console.log('✅ 6 providers created/found');

  // ─── PROCUREMENT PLANS ───────────────────────────────────────────────────────
  const planQuito = await upsertProcurementPlan(gadQuito.id, 2024, 'PAC Quito 2024');
  const planSalud = await upsertProcurementPlan(minSalud.id, 2024, 'PAC Salud 2024');
  const planSenagua = await upsertProcurementPlan(senagua.id, 2024, 'PAC Agua 2024');
  const planPetro = await upsertProcurementPlan(petroecuador.id, 2024, 'PAC Petro 2024');
  const planHosp = await upsertProcurementPlan(hospitalGeneral.id, 2024, 'PAC Hospital 2024');

  console.log('✅ Procurement plans created/found');

  // ─── TENDERS ─────────────────────────────────────────────────────────────────
  // GAD Quito: 8 tenders
  const tQuito1 = await upsertTender('QUITO-2024-001', 'Construcción de infraestructura vial', planQuito.id, 'licitacion', 800_000, 'awarded');
  const tQuito2 = await upsertTender('QUITO-2024-002', 'Adquisición de equipos TI', planQuito.id, 'subasta_inversa', 120_000, 'awarded');
  const tQuito3 = await upsertTender('QUITO-2024-003', 'Servicios de consultoría urbana', planQuito.id, 'cotizacion', 45_000, 'active');
  const tQuito4 = await upsertTender('QUITO-2024-004', 'Mantenimiento de parques y jardines', planQuito.id, 'menor_cuantia', 25_000, 'awarded');
  const tQuito5 = await upsertTender('QUITO-2024-005', 'Sistema de gestión municipal', planQuito.id, 'licitacion', 350_000, 'awarded');
  const tQuito6 = await upsertTender('QUITO-2024-006', 'Obras de alcantarillado sector norte', planQuito.id, 'licitacion', 1_200_000, 'active');
  const tQuito7 = await upsertTender('QUITO-2024-007', 'Adquisición de vehículos municipales', planQuito.id, 'subasta_inversa', 95_000, 'awarded');
  const tQuito8 = await upsertTender('QUITO-2024-008', 'Servicios de seguridad', planQuito.id, 'cotizacion', 60_000, 'active');

  // Ministerio de Salud: 5 tenders
  const tSalud1 = await upsertTender('MSP-2024-001', 'Medicamentos básicos lote 1', planSalud.id, 'subasta_inversa', 500_000, 'awarded');
  const tSalud2 = await upsertTender('MSP-2024-002', 'Equipos médicos hospitalarios', planSalud.id, 'licitacion', 1_500_000, 'awarded');
  const tSalud3 = await upsertTender('MSP-2024-003', 'Insumos de laboratorio', planSalud.id, 'menor_cuantia', 18_000, 'awarded');
  const tSalud4 = await upsertTender('MSP-2024-004', 'Construcción UCSF rural', planSalud.id, 'licitacion', 750_000, 'active');
  const tSalud5 = await upsertTender('MSP-2024-005', 'Sistema de información médica', planSalud.id, 'cotizacion', 80_000, 'awarded');

  // SENAGUA: 4 tenders (clean)
  const tSenagua1 = await upsertTender('SENAGUA-2024-001', 'Monitoreo cuencas hidrográficas', planSenagua.id, 'cotizacion', 95_000, 'awarded');
  const tSenagua2 = await upsertTender('SENAGUA-2024-002', 'Estudios de factibilidad hídrica', planSenagua.id, 'menor_cuantia', 22_000, 'awarded');
  const tSenagua3 = await upsertTender('SENAGUA-2024-003', 'Construcción de embalse', planSenagua.id, 'licitacion', 3_200_000, 'active');
  const tSenagua4 = await upsertTender('SENAGUA-2024-004', 'Rehabilitación sistema riego', planSenagua.id, 'cotizacion', 135_000, 'awarded');

  // Petroecuador: 3 tenders (large)
  const tPetro1 = await upsertTender('PETRO-2024-001', 'Mantenimiento plantas refinería', planPetro.id, 'licitacion', 2_500_000, 'awarded');
  const tPetro2 = await upsertTender('PETRO-2024-002', 'Adquisición de tuberías especiales', planPetro.id, 'licitacion', 1_800_000, 'awarded');
  const tPetro3 = await upsertTender('PETRO-2024-003', 'Servicios ambientales período 2', planPetro.id, 'cotizacion', 650_000, 'active');

  // Hospital General: 5 tenders
  const tHosp1 = await upsertTender('HOSP-2024-001', 'Medicamentos y reactivos', planHosp.id, 'subasta_inversa', 280_000, 'awarded');
  const tHosp2 = await upsertTender('HOSP-2024-002', 'Equipos de diagnóstico avanzado', planHosp.id, 'licitacion', 900_000, 'awarded');
  const tHosp3 = await upsertTender('HOSP-2024-003', 'Servicios de limpieza institucional', planHosp.id, 'menor_cuantia', 35_000, 'awarded');
  const tHosp4 = await upsertTender('HOSP-2024-004', 'Remodelación quirófanos', planHosp.id, 'licitacion', 550_000, 'awarded');
  const tHosp5 = await upsertTender('HOSP-2024-005', 'Sistema de información hospitalaria', planHosp.id, 'cotizacion', 75_000, 'active');

  console.log('✅ Tenders created/found');

  // ─── BIDS ─────────────────────────────────────────────────────────────────────
  // TechCorp bids on many tenders across 3 entities
  await upsertBid(tQuito2.id, techCorp.id, 115_000, 1);
  await upsertBid(tQuito5.id, techCorp.id, 340_000, 1);
  await upsertBid(tSalud5.id, techCorp.id, 78_000, 1);
  await upsertBid(tSenagua1.id, techCorp.id, 90_000, 2);
  await upsertBid(tHosp5.id, techCorp.id, 72_000, 1);

  // ConstructoraXYZ bids only on GAD Quito
  await upsertBid(tQuito1.id, constructora.id, 790_000, 1);
  await upsertBid(tQuito6.id, constructora.id, 1_180_000, 1);
  await upsertBid(tQuito4.id, constructora.id, 24_000, 2);
  await upsertBid(tQuito7.id, constructora.id, 92_000, 2);

  // MedSur bids on healthcare entities
  await upsertBid(tSalud1.id, medSur.id, 490_000, 1);
  await upsertBid(tSalud3.id, medSur.id, 17_500, 1);
  await upsertBid(tHosp1.id, medSur.id, 275_000, 1);
  await upsertBid(tHosp3.id, medSur.id, 33_500, 1);
  await upsertBid(tHosp4.id, medSur.id, 540_000, 2);

  // NewCompany: one large win
  await upsertBid(tPetro2.id, newCompany.id, 1_750_000, 1);

  // GrupoABC: connected to multiple providers (network hub)
  await upsertBid(tQuito1.id, grupoABC.id, 795_000, 2);
  await upsertBid(tQuito6.id, grupoABC.id, 1_190_000, 2);
  await upsertBid(tSenagua3.id, grupoABC.id, 3_150_000, 1);
  await upsertBid(tPetro1.id, grupoABC.id, 2_450_000, 2);

  // SiemprePierde: always loses
  await upsertBid(tQuito3.id, siemprePierde.id, 50_000, 3);
  await upsertBid(tQuito7.id, siemprePierde.id, 98_000, 3);
  await upsertBid(tSalud2.id, siemprePierde.id, 1_600_000, 3);
  await upsertBid(tSenagua4.id, siemprePierde.id, 145_000, 2);
  await upsertBid(tPetro3.id, siemprePierde.id, 680_000, 2);
  await upsertBid(tHosp2.id, siemprePierde.id, 950_000, 3);
  await upsertBid(tHosp4.id, siemprePierde.id, 560_000, 3);
  await upsertBid(tHosp5.id, siemprePierde.id, 78_000, 3);

  console.log('✅ Bids created/found');

  // ─── CONTRACTS ───────────────────────────────────────────────────────────────
  const cQuito1 = await upsertContract('CNT-QUITO-001', tQuito1.id, constructora.id, 790_000, 'active');
  const cQuito2 = await upsertContract('CNT-QUITO-002', tQuito2.id, techCorp.id, 115_000, 'active');
  const cQuito3 = await upsertContract('CNT-QUITO-004', tQuito4.id, constructora.id, 24_000, 'completed');
  const cQuito4 = await upsertContract('CNT-QUITO-005', tQuito5.id, techCorp.id, 340_000, 'active');
  const cQuito5 = await upsertContract('CNT-QUITO-007', tQuito7.id, techCorp.id, 93_000, 'completed');
  const cQuito6 = await upsertContract('CNT-QUITO-008', tQuito8.id, grupoABC.id, 58_000, 'terminated');

  const cSalud1 = await upsertContract('CNT-MSP-001', tSalud1.id, medSur.id, 490_000, 'active');
  const cSalud2 = await upsertContract('CNT-MSP-002', tSalud2.id, constructora.id, 1_490_000, 'active');
  const cSalud3 = await upsertContract('CNT-MSP-003', tSalud3.id, medSur.id, 17_500, 'completed');
  const cSalud5 = await upsertContract('CNT-MSP-005', tSalud5.id, techCorp.id, 78_000, 'completed');

  const cSenagua1 = await upsertContract('CNT-SENAGUA-001', tSenagua1.id, techCorp.id, 90_000, 'completed');
  const cSenagua2 = await upsertContract('CNT-SENAGUA-002', tSenagua2.id, grupoABC.id, 22_000, 'completed');
  const cSenagua4 = await upsertContract('CNT-SENAGUA-004', tSenagua4.id, grupoABC.id, 135_000, 'active');

  const cPetro1 = await upsertContract('CNT-PETRO-001', tPetro1.id, grupoABC.id, 2_450_000, 'active');
  const cPetro2 = await upsertContract('CNT-PETRO-002', tPetro2.id, newCompany.id, 1_750_000, 'suspended');

  const cHosp1 = await upsertContract('CNT-HOSP-001', tHosp1.id, medSur.id, 275_000, 'active');
  const cHosp2 = await upsertContract('CNT-HOSP-002', tHosp2.id, constructora.id, 895_000, 'active');
  const cHosp3 = await upsertContract('CNT-HOSP-003', tHosp3.id, medSur.id, 33_500, 'completed');
  const cHosp4 = await upsertContract('CNT-HOSP-004', tHosp4.id, techCorp.id, 540_000, 'active');
  const cHosp5 = await upsertContract('CNT-HOSP-005', tHosp5.id, techCorp.id, 72_000, 'active');

  console.log('✅ Contracts created/found');

  // ─── AMENDMENTS (Hospital has many) ──────────────────────────────────────────
  let amendNo = 1;
  async function upsertAmendment(contractId: string, changeType: string, _description: string, amount: number | null) {
    const existing = await prisma.contractAmendment.findFirst({ where: { contractId, changeType } });
    if (existing) return existing;
    return prisma.contractAmendment.create({
      data: { contractId, changeType, reason: _description, valueAfter: amount, amendmentNo: amendNo++ },
    });
  }

  // Quito contract 1: 2 amendments
  await upsertAmendment(cQuito1.id, 'PLAZO', 'Extensión 60 días por condiciones climáticas', null);
  await upsertAmendment(cQuito1.id, 'MONTO', 'Incremento por materiales adicionales', 820_000);

  // Salud contract 2: 1 amendment
  await upsertAmendment(cSalud2.id, 'ALCANCE', 'Ampliación de alcance a pisos 3 y 4', null);

  // Hospital contracts: many amendments
  await upsertAmendment(cHosp2.id, 'PLAZO', 'Extensión 90 días por pandemia', null);
  await upsertAmendment(cHosp2.id, 'MONTO', 'Incremento 5% por inflación insumos', 940_000);
  await upsertAmendment(cHosp2.id, 'ALCANCE', 'Inclusión de sala de recuperación', null);
  await upsertAmendment(cHosp4.id, 'PLAZO', 'Extensión 45 días por importación equipos', null);
  await upsertAmendment(cHosp4.id, 'MONTO', 'Ajuste por tipo de cambio', 555_000);
  await upsertAmendment(cHosp4.id, 'ALCANCE', 'Adicional mantenimiento primer año', null);
  await upsertAmendment(cHosp5.id, 'PLAZO', 'Extensión por migración de datos', null);

  // Petroecuador: 1 amendment
  await upsertAmendment(cPetro1.id, 'MONTO', 'Ajuste por costo de materiales petroquímicos', 2_550_000);

  console.log('✅ Amendments created/found');

  // ─── RISK SCORES ─────────────────────────────────────────────────────────────
  async function upsertRiskScore(tenderId: string, score: number, level: 'low' | 'medium' | 'high', flags: string[]) {
    const existing = await prisma.riskScore.findFirst({ where: { tenderId } });
    if (existing) return existing;
    return prisma.riskScore.create({
      data: { tenderId, totalScore: score, riskLevel: level, flags, calculatedAt: new Date() },
    });
  }

  await upsertRiskScore(tQuito1.id, 35, 'low', []);
  await upsertRiskScore(tQuito2.id, 45, 'medium', ['OVERPRICE']);
  await upsertRiskScore(tQuito4.id, 15, 'low', []);
  await upsertRiskScore(tQuito5.id, 20, 'low', []);
  await upsertRiskScore(tSalud1.id, 55, 'medium', ['SINGLE_BIDDER', 'FAST_PROCESS']);
  await upsertRiskScore(tSalud2.id, 72, 'high', ['DOMINANT_SUPPLIER', 'OVERPRICE']);
  await upsertRiskScore(tSalud3.id, 80, 'high', ['SINGLE_BIDDER', 'NEW_COMPANY_LARGE_CONTRACT']);
  await upsertRiskScore(tSenagua1.id, 18, 'low', []);
  await upsertRiskScore(tSenagua2.id, 12, 'low', []);
  await upsertRiskScore(tSenagua4.id, 22, 'low', []);
  await upsertRiskScore(tPetro1.id, 65, 'high', ['DOMINANT_SUPPLIER', 'FRAGMENTATION']);
  await upsertRiskScore(tPetro2.id, 78, 'high', ['NEW_COMPANY_LARGE_CONTRACT', 'FAST_PROCESS']);
  await upsertRiskScore(tHosp1.id, 30, 'low', []);
  await upsertRiskScore(tHosp2.id, 48, 'medium', ['FREQUENT_AMENDMENTS']);
  await upsertRiskScore(tHosp4.id, 62, 'high', ['FREQUENT_AMENDMENTS', 'OVERPRICE']);

  console.log('✅ Risk scores created/found');

  // ─── ALERT EVENTS ─────────────────────────────────────────────────────────────
  async function upsertAlert(
    alertType: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    entityType: string,
    entityId: string,
    message: string,
    resolvedMeta?: { notes: string; actionTaken: string; resolvedBy: string },
  ) {
    const existing = await prisma.alertEvent.findFirst({ where: { alertType, entityType, entityId } });
    if (existing) return existing;
    return prisma.alertEvent.create({
      data: {
        alertType,
        severity,
        entityType,
        entityId,
        message,
        metadata: resolvedMeta ?? {},
        resolvedAt: resolvedMeta ? new Date() : null,
      },
    });
  }

  // Active alerts for GAD Quito
  await upsertAlert('SINGLE_BIDDER', 'CRITICAL', 'Tender', tQuito8.id,
    'Proceso de servicios de seguridad con un único oferente.');
  await upsertAlert('OVERPRICE', 'WARNING', 'Tender', tQuito2.id,
    'Adquisición TI adjudicada al 96% del presupuesto referencial.');

  // Active alerts for Ministerio de Salud
  await upsertAlert('DOMINANT_SUPPLIER', 'CRITICAL', 'Tender', tSalud2.id,
    'Proveedor dominante con más del 60% de contratos MSP en el año.');
  await upsertAlert('SINGLE_BIDDER', 'CRITICAL', 'Tender', tSalud3.id,
    'Insumos adjudicados con oferta única en proceso de menor cuantía.');

  // Pre-resolved alerts (for resolve modal display)
  await upsertAlert('FAST_PROCESS', 'WARNING', 'Tender', tSalud1.id,
    'Proceso adjudicado en 12 días hábiles.',
    { notes: 'Revisado por control interno, plazo justificado por emergencia sanitaria.', actionTaken: 'investigation_opened', resolvedBy: 'control.interno@msp.gob.ec' });

  await upsertAlert('FRAGMENTATION', 'CRITICAL', 'Tender', tPetro1.id,
    'Tres contratos similares en 28 días detectados en Petroecuador.',
    { notes: 'Contratos correspondientes a fases técnicas independientes.', actionTaken: 'false_positive', resolvedBy: 'auditoria@petroecuador.gob.ec' });

  await upsertAlert('FREQUENT_AMENDMENTS', 'WARNING', 'Tender', tHosp2.id,
    'Contrato con 3 modificaciones registradas.',
    { notes: 'Modificaciones aprobadas por Comité de Contratación.', actionTaken: 'corrective_action', resolvedBy: 'contratacion@ffaa.mil.ec' });

  // Alert for hospital
  await upsertAlert('FREQUENT_AMENDMENTS', 'CRITICAL', 'Tender', tHosp4.id,
    'Quirófanos con 3+ modificaciones de monto y alcance.');

  console.log('✅ Alert events created/found');

  // ─── PROVIDER SCORES (for drill-down providers) ───────────────────────────────
  async function upsertDrilldownScore(
    providerId: string,
    compliance: number,
    delivery: number,
    price: number,
    diversity: number,
  ) {
    const total = (compliance + delivery + price + diversity) / 4;
    const tier = total >= 80 ? 'premium' : total >= 50 ? 'standard' : total >= 30 ? 'watch' : 'restricted';
    const existing = await prisma.providerScore.findFirst({ where: { providerId } });
    if (existing) return existing;
    return prisma.providerScore.create({
      data: {
        providerId,
        complianceScore: compliance,
        deliveryScore: delivery,
        priceScore: price,
        diversityScore: diversity,
        totalScore: total,
        tier,
        calculatedAt: new Date(),
      },
    });
  }

  await upsertDrilldownScore(techCorp.id, 92, 88, 85, 95);
  await upsertDrilldownScore(constructora.id, 55, 50, 60, 35);
  await upsertDrilldownScore(medSur.id, 75, 72, 68, 62);
  await upsertDrilldownScore(newCompany.id, 20, 15, 45, 10);
  await upsertDrilldownScore(grupoABC.id, 70, 65, 55, 72);
  await upsertDrilldownScore(siemprePierde.id, 10, 5, 30, 8);

  console.log('✅ Provider scores created/found');

  // ─── PROVIDER RELATIONS (for network) ─────────────────────────────────────────
  async function upsertRelation(providerAId: string, providerBId: string, sharedTenders: number) {
    const [a, b] = [providerAId, providerBId].sort();
    const existing = await prisma.providerRelation.findFirst({
      where: { OR: [{ providerAId: a, providerBId: b }, { providerAId: b, providerBId: a }] },
    });
    if (existing) return existing;
    return prisma.providerRelation.create({
      data: { providerAId: a, providerBId: b, sharedTenders },
    });
  }

  await upsertRelation(constructora.id, grupoABC.id, 3);
  await upsertRelation(techCorp.id, grupoABC.id, 2);
  await upsertRelation(techCorp.id, medSur.id, 2);
  await upsertRelation(constructora.id, siemprePierde.id, 2);
  await upsertRelation(grupoABC.id, siemprePierde.id, 3);

  console.log('✅ Provider relations created/found');

  // ─── FRAGMENTATION ALERTS ─────────────────────────────────────────────────────
  async function upsertFragAlert(entityId: string, pattern: string, contractIds: string[], totalAmount: number) {
    const existing = await prisma.fragmentationAlert.findFirst({ where: { entityId, pattern } });
    if (existing) return existing;
    return prisma.fragmentationAlert.create({
      data: {
        entityId,
        pattern,
        contractIds,
        totalAmount,
        contractCount: contractIds.length,
        periodDays: 28,
        severity: contractIds.length >= 4 ? 'CRITICAL' : 'WARNING',
      },
    });
  }

  await upsertFragAlert(
    gadQuito.id,
    'AMOUNT_CLUSTER',
    [cQuito3.id, cQuito5.id, cQuito6.id],
    24_000 + 93_000 + 58_000,
  );

  await upsertFragAlert(
    petroecuador.id,
    'TEMPORAL_CLUSTER',
    [cPetro1.id, cPetro2.id],
    2_450_000 + 1_750_000,
  );

  console.log('✅ Fragmentation alerts created/found');

  // ─── PRICE REFERENCES ─────────────────────────────────────────────────────────
  const priceRefData = [
    { processType: 'licitacion', province: 'Nacional', avg: 1_200_000, min: 350_000, max: 3_200_000, count: 12 },
    { processType: 'subasta_inversa', province: 'Nacional', avg: 250_000, min: 80_000, max: 500_000, count: 20 },
    { processType: 'cotizacion', province: 'Nacional', avg: 75_000, min: 22_000, max: 135_000, count: 15 },
    { processType: 'menor_cuantia', province: 'Nacional', avg: 22_000, min: 10_000, max: 35_000, count: 30 },
    { processType: 'licitacion', province: 'Pichincha', avg: 1_100_000, min: 320_000, max: 2_800_000, count: 8 },
  ];

  for (const pr of priceRefData) {
    const existing = await prisma.priceReference.findFirst({ where: { processType: pr.processType, province: pr.province } });
    if (!existing) {
      await prisma.priceReference.create({
        data: {
          processType: pr.processType,
          description: `${pr.processType} – ${pr.province}`,
          avgPrice: pr.avg,
          minPrice: pr.min,
          maxPrice: pr.max,
          sampleSize: pr.count,
          year: 2024,
          province: pr.province,
        },
      });
    }
  }

  console.log('✅ Price references created/found');

  console.log('\n🎉 Drill-down seed complete!');
  console.log(`
Summary:
  Entities       : 5 (GAD Quito, MSP, SENAGUA, Petroecuador, Hospital)
  Providers      : 6 (TechCorp, ConstructoraXYZ, MedSur, NewCompany, GrupoABC, SiemprePierde)
  Tenders        : 25
  Contracts      : 20
  Amendments     : 11
  Risk Scores    : 15
  Alert Events   : 8 (5 open, 3 resolved)
  Provider Scores: 6
  Relations      : 5
  Frag Alerts    : 2
  Price Refs     : 5
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
