import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Datos tipo SERCOP – entidades y procesos de contratación pública (Ecuador)
const ENTITIES = [
  { name: 'Ministerio de Educación', code: 'MEC', legalName: 'Ministerio de Educación del Ecuador', organizationType: 'ministerio' },
  { name: 'Ministerio de Salud Pública', code: 'MSP', legalName: 'Ministerio de Salud Pública del Ecuador', organizationType: 'ministerio' },
  { name: 'Municipio de Quito', code: 'GAD-Q', legalName: 'Municipio del Distrito Metropolitano de Quito', organizationType: 'gad' },
  { name: 'Instituto Ecuatoriano de Seguridad Social', code: 'IESS', legalName: 'IESS', organizationType: 'institucion' },
  { name: 'Servicio Nacional de Contratación Pública', code: 'SERCOP', legalName: 'SERCOP', organizationType: 'institucion' },
];

// Proveedores tipo RUP (Registro Único de Proveedores)
const PROVIDERS = [
  { name: 'Tecnología Ecuador S.A.', identifier: '1791234567001', legalName: 'Tecnología Ecuador Sociedad Anónima', tradeName: 'TecEcuador', province: 'Pichincha', canton: 'Quito', address: 'Av. Amazonas N23-45' },
  { name: 'Suministros Industriales Cía. Ltda.', identifier: '1792345678001', legalName: 'Suministros Industriales Compañía Limitada', tradeName: 'SumInd', province: 'Guayas', canton: 'Guayaquil', address: 'Av. 9 de Octubre 123' },
  { name: 'Construcciones Andinas S.A.', identifier: '1793456789001', legalName: 'Construcciones Andinas Sociedad Anónima', tradeName: 'ConstAndinas', province: 'Pichincha', canton: 'Quito', address: 'Av. de los Shyris' },
  { name: 'Servicios de Limpieza Pro', identifier: '1794567890001', legalName: 'Servicios de Limpieza Profesional', tradeName: 'LimpiezaPro', province: 'Azuay', canton: 'Cuenca', address: 'Calle Larga 456' },
  { name: 'Equipos Médicos del Ecuador', identifier: '1795678901001', legalName: 'Equipos Médicos del Ecuador S.A.', tradeName: 'EquipMed', province: 'Pichincha', canton: 'Quito', address: 'Av. República del Salvador' },
  { name: 'Papelería y Oficina Cía. Ltda.', identifier: '1796789012001', legalName: 'Papelería y Oficina Compañía Limitada', tradeName: 'PapelOfi', province: 'Pichincha', canton: 'Quito', address: 'Av. 10 de Agosto' },
];

const RAG_CHUNKS = [
  { title: 'LOSNCP – Ley Orgánica del Sistema Nacional de Contratación Pública', content: `La Ley Orgánica del Sistema Nacional de Contratación Pública (LOSNCP) regula la contratación pública en Ecuador. Establece los principios de transparencia, competencia, eficiencia y responsabilidad. El sistema de contratación pública comprende los procesos de contratación de bienes, servicios, obras y consultorías. Las entidades contratantes deben publicar sus procesos en el portal único.`, source: 'normativa', documentType: 'ley', url: null as string | null },
  { title: 'Reglamento General a la LOSNCP', content: `El Reglamento General desarrolla las disposiciones de la LOSNCP. Define los procedimientos de contratación: concurso de ofertas, cotización, licitación. Establece los umbrales y montos para cada tipo de proceso. Los proveedores deben estar inscritos en el RUP (Registro Único de Proveedores).`, source: 'normativa', documentType: 'reglamento', url: null as string | null },
  { title: 'Manual de Contratación Pública', content: `El manual de contratación pública es una guía para entidades y proveedores. Explica cómo registrar ofertas, presentar documentos y participar en procesos. Incluye preguntas frecuentes sobre el PAC (Plan Anual de Contratación). Los procesos de contratación deben respetar los plazos establecidos.`, source: 'manuales', documentType: 'manual', url: null as string | null },
  { title: 'Resolución SERCOP – Catálogo electrónico', content: `Las resoluciones del SERCOP regulan aspectos específicos del sistema. El catálogo electrónico permite la adquisición de bienes y servicios de bajo monto. Los proveedores deben mantener actualizada su información en el RUP.`, source: 'resoluciones', documentType: 'resolucion', url: null as string | null },
  { title: 'Procedimiento de contratación directa', content: `La contratación directa aplica cuando el monto no supera los umbrales establecidos. El proveedor debe estar inscrito en el RUP. La entidad debe justificar la selección del proveedor.`, source: 'normativa', documentType: 'guia', url: null as string | null },
  { title: 'Modelo de pliego tipo – Licitación pública', content: `Pliego tipo para procesos de licitación pública. Incluye requisitos de participación, criterios de evaluación, BAE (Valor Agregado Ecuatoriano), participación nacional y plazos. Las ofertas deben adjuntar documentación según el proceso.`, source: 'modelos', documentType: 'modelo_pliego', url: null as string | null },
  { title: 'Comunicado – Fichas técnicas uniformes escolares', content: `Se informa a las entidades contratantes y proveedores sobre la publicación de las fichas técnicas de uniformes escolares. Los documentos están disponibles en el portal para consulta. Fecha de publicación: 2025.`, source: 'comunicados', documentType: 'comunicado', url: null as string | null },
  { title: 'Comunicado – Documentos de incorporación a catálogo', content: `Información sobre documentos de incorporación para proveedores en catálogo dinámico inclusivo y catálogo electrónico. Consulte la sección correspondiente en el portal para requisitos y plazos.`, source: 'comunicados', documentType: 'comunicado', url: null as string | null },
];

async function main() {
  const year = new Date().getFullYear();

  // Entidades
  const entities: { id: string; name: string; code: string | null }[] = [];
  for (const e of ENTITIES) {
    const entity = await prisma.entity.upsert({
      where: { code: e.code },
      update: { name: e.name, legalName: e.legalName, organizationType: e.organizationType },
      create: e,
    });
    entities.push(entity);
  }
  console.log(`  ${entities.length} entidades`);

  // Usuarios (para login entity)
  for (const entity of entities.slice(0, 3)) {
    await prisma.user.upsert({
      where: { email: `admin@${entity.code?.toLowerCase()}.gob.ec` },
      update: {},
      create: {
        email: `admin@${entity.code?.toLowerCase()}.gob.ec`,
        fullName: `Administrador ${entity.name}`,
        status: 'active',
        organizationId: entity.id,
      },
    });
  }
  console.log('  Usuarios entity creados (admin@mec.gob.ec, admin@msp.gob.ec, admin@gad-q.gob.ec)');

  // Proveedores
  const providers: { id: string; name: string; identifier: string | null }[] = [];
  for (const p of PROVIDERS) {
    const existing = await prisma.provider.findFirst({ where: { identifier: p.identifier } });
    const provider = existing ?? await prisma.provider.create({ data: p });
    providers.push(provider);
  }
  console.log(`  ${providers.length} proveedores`);

  // Existencia legal y patrimonio (Fase 5) – primer proveedor para licitaciones > 500k
  if (providers[0]) {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    await prisma.provider.update({
      where: { id: providers[0].id },
      data: {
        legalEstablishmentDate: threeYearsAgo,
        patrimonyAmount: 80000,
      },
    });
    console.log('  Proveedor con existencia legal y patrimonio (pruebas licitación)');
  }

  // PAC y procesos de contratación (códigos tipo SERCOP: ENTIDAD-AÑO-CO-NNN)
  let tenderCount = 0;
  const allTenderIds: string[] = [];
  for (const entity of entities) {
    let plan = await prisma.procurementPlan.findFirst({
      where: { entityId: entity.id, year },
    });
    if (!plan) {
      plan = await prisma.procurementPlan.create({
        data: {
          entityId: entity.id,
          year,
          status: 'published',
          publishedAt: new Date(),
          totalAmount: 500000,
        },
      });
    }

    const tendersData = [
      { title: 'Compra de equipos de cómputo', description: 'Adquisición de laptops y computadoras para oficinas (SERCOP)', method: 'open' as const, amount: 45000, processType: 'licitacion' as const, regime: 'ordinario' as const, territoryPreference: 'amazonia' as const, minimumQuotes: null as number | null },
      { title: 'Servicios de limpieza anual', description: 'Contratación de servicios de aseo para instalaciones', method: 'direct' as const, amount: 12000, processType: 'contratacion_directa' as const, regime: 'ordinario' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
      { title: 'Suministro de material de oficina', description: 'Papelería, útiles y consumibles', method: 'catalog' as const, amount: 5000, processType: 'catalogo' as const, regime: 'infima_cuantia' as const, territoryPreference: 'galapagos' as const, minimumQuotes: 3 as number | null },
      { title: 'Mantenimiento de equipos médicos', description: 'Servicio técnico especializado', method: 'open' as const, amount: 28000, processType: 'licitacion' as const, regime: 'ordinario' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
      { title: 'Obra de construcción menor', description: 'Remodelación de área administrativa', method: 'open' as const, amount: 85000, processType: 'licitacion' as const, regime: 'especial' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
      { title: 'Subasta inversa electrónica – Suministros', description: 'Proceso SIE para adquisición de suministros (prueba SIE)', method: 'open' as const, amount: 35000, processType: 'sie' as const, regime: 'ordinario' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
      { title: 'Feria inclusiva – Productos locales', description: 'Proceso de feria inclusiva (en desarrollo SERCOP)', method: 'open' as const, amount: 15000, processType: 'feria_inclusiva' as const, regime: 'ordinario' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
      { title: 'Adquisición por emergencia', description: 'Suministros por contingencia o emergencia', method: 'direct' as const, amount: 22000, processType: 'contratacion_directa' as const, regime: 'emergencia' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
    ];

    let seq = 1;
    for (const t of tendersData) {
      const code = `${entity.code}-${year}-CO-${String(seq).padStart(3, '0')}`;
      const existing = await prisma.tender.findFirst({
        where: { OR: [{ procurementPlanId: plan.id, title: t.title }, { code }] },
      });
      if (!existing) {
        const tender = await prisma.tender.create({
          data: {
            procurementPlanId: plan.id,
            code,
            title: t.title,
            description: t.description,
            status: 'published',
            procurementMethod: t.method,
            processType: t.processType,
            regime: t.regime,
            territoryPreference: t.territoryPreference ?? undefined,
            minimumQuotes: t.minimumQuotes ?? undefined,
            estimatedAmount: t.amount,
            publishedAt: new Date(),
          },
        });
        tenderCount++;
        allTenderIds.push(tender.id);
      }
      seq++;
    }

    // Un proceso en borrador con solicitud de liberación (no producción nacional) para pruebas
    const draftCode = `${entity.code}-${year}-CO-900`;
    if (entity.code === 'MEC' && !(await prisma.tender.findFirst({ where: { code: draftCode } }))) {
      await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code: draftCode,
          title: 'Adquisición sin producción nacional (liberación)',
          description: 'Proceso de prueba para liberación por no producción nacional',
          status: 'draft',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 30000,
          liberationRequestedAt: new Date(),
        },
      });
      tenderCount++;
      console.log('  Proceso draft con liberación solicitada (MEC-CO-900)');
    }

    // Licitación bienes y servicios con cronograma, presupuesto referencial y comisión (Fase 5)
    const licitacionCode = `${entity.code}-${year}-CO-901`;
    if (entity.code === 'MEC' && !(await prisma.tender.findFirst({ where: { code: licitacionCode } }))) {
      const now = new Date();
      const questionsDeadline = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const bidsDeadline = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const convalidationReq = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const convalidationResp = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code: licitacionCode,
          title: 'Licitación bienes y servicios – gran escala (cronograma)',
          description: 'Proceso con presupuesto referencial, cronograma normativo y comisión técnica para pruebas E2E.',
          status: 'published',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 150000,
          referenceBudgetAmount: 150000,
          questionsDeadlineAt: questionsDeadline,
          bidsDeadlineAt: bidsDeadline,
          clarificationResponseDeadlineAt: new Date(bidsDeadline.getTime() + 2 * 24 * 60 * 60 * 1000),
          convalidationRequestDeadlineAt: convalidationReq,
          convalidationResponseDeadlineAt: convalidationResp,
          scoringDeadlineAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          awardResolutionDeadlineAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          responsibleType: 'commission',
          electronicSignatureRequired: true,
          bidsOpenedAt: new Date(bidsDeadline.getTime() + 2 * 60 * 60 * 1000),
          publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      });
      tenderCount++;
      console.log('  Licitación con cronograma (MEC-CO-901)');
    }

    // Licitación con límite ofertas pasado y sin apertura – para probar botón "Abrir ofertas" (Fase 5)
    const licitacionCode2 = `${entity.code}-${year}-CO-902`;
    if (entity.code === 'MEC' && !(await prisma.tender.findFirst({ where: { code: licitacionCode2 } }))) {
      const now = new Date();
      const bidsDeadlinePast = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code: licitacionCode2,
          title: 'Licitación – pendiente apertura de ofertas',
          description: 'Proceso con límite de ofertas vencido; sin registrar apertura (prueba UI).',
          status: 'published',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 80000,
          referenceBudgetAmount: 80000,
          bidsDeadlineAt: bidsDeadlinePast,
          responsibleType: 'delegate',
          electronicSignatureRequired: true,
          publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      });
      tenderCount++;
      console.log('  Licitación pendiente apertura (MEC-CO-902)');
    }
  }
  console.log(`  PAC y ${tenderCount} procesos de contratación (códigos SERCOP)`);

  // Bids (ofertas) – algunos proveedores presentan ofertas
  const tenders = await prisma.tender.findMany({ where: { status: 'published' }, take: 8 });
  for (let i = 0; i < tenders.length; i++) {
    const tender = tenders[i];
    const provider = providers[i % providers.length];
    const existing = await prisma.bid.findFirst({
      where: { tenderId: tender.id, providerId: provider.id },
    });
    if (!existing) {
      await prisma.bid.create({
        data: {
          tenderId: tender.id,
          providerId: provider.id,
          amount: 40000 + Math.floor(Math.random() * 10000),
          status: 'submitted',
          submittedAt: new Date(),
        },
      });
    }
  }
  console.log('  Ofertas (bids) creadas');

  // Bids licitación CO-901: autoinvitación y convalidación (Fase 5)
  const licTender = await prisma.tender.findFirst({
    where: { code: { endsWith: '-CO-901' } },
    select: { id: true },
  });
  if (licTender && providers.length >= 4) {
    const [p0, p1, p2, p3] = providers;
    const baseBid = await prisma.bid.findFirst({ where: { tenderId: licTender.id } });
    if (!baseBid) {
      await prisma.bid.create({
        data: {
          tenderId: licTender.id,
          providerId: p0.id,
          amount: 145000,
          status: 'submitted',
          submittedAt: new Date(),
          invitationType: 'invited',
        },
      });
      await prisma.bid.create({
        data: {
          tenderId: licTender.id,
          providerId: p1.id,
          amount: 148000,
          status: 'submitted',
          submittedAt: new Date(),
          invitationType: 'self_invited',
        },
      });
      await prisma.bid.create({
        data: {
          tenderId: licTender.id,
          providerId: p2.id,
          amount: 142000,
          status: 'submitted',
          submittedAt: new Date(),
          convalidationRequestedAt: new Date(),
          convalidationStatus: 'pending',
          convalidationErrorsDescription: 'Error en ítem 2 del desglose económico; documento de garantía con fecha vencida. Se solicita convalidación conforme al pliego.',
        },
      });
      await prisma.bid.create({
        data: {
          tenderId: licTender.id,
          providerId: p3.id,
          amount: 144000,
          status: 'submitted',
          submittedAt: new Date(),
          convalidationRequestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          convalidationRespondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          convalidationStatus: 'accepted',
          convalidationErrorsDescription: 'Falta firma en hoja 3 del formulario de oferta.',
          convalidationResponse: 'Se acepta la convalidación. El proveedor presentó documento sustituto dentro del plazo.',
          rupVerifiedAtOpening: new Date(),
        },
      });
      console.log('  Ofertas licitación CO-901: invitada, autoinvitación, convalidación pendiente y aceptada');
    }
  }

  // Un contrato con administrador designado para pruebas (página contrato – texto solo entidad puede suspender)
  const tenderWithBid = await prisma.tender.findFirst({
    where: { status: 'published' },
    include: { bids: { take: 1 } },
  });
  if (tenderWithBid?.bids?.[0]) {
    const existingContract = await prisma.contract.findUnique({ where: { tenderId: tenderWithBid.id } });
    if (!existingContract) {
      await prisma.contract.create({
        data: {
          tenderId: tenderWithBid.id,
          providerId: tenderWithBid.bids[0].providerId,
          contractNo: `CON-${year}-001`,
          status: 'in_progress',
          amount: tenderWithBid.bids[0].amount ?? 40000,
          administratorName: 'Responsable de seguimiento',
          administratorEmail: 'admin@mec.gob.ec',
          administratorDesignatedAt: new Date(),
          awardPublishedAt: new Date(),
        },
      });
      console.log('  Contrato de prueba creado (administrador designado, publicación adjudicación)');
    }
  }

  // Bulk: >1000 registros – procesos adicionales, ofertas, denuncias, reclamos, aclaraciones
  let bulkTenders = 0;
  let bulkBids = 0;
  for (const entity of entities) {
    const plan = await prisma.procurementPlan.findFirst({ where: { entityId: entity.id, year } });
    if (!plan) continue;
    for (let i = 7; i <= 46; i++) {
      const code = `${entity.code}-${year}-CO-${String(i).padStart(3, '0')}`;
      const existing = await prisma.tender.findFirst({ where: { code } });
      if (existing) continue;
      const territoryPreference = i % 3 === 0 ? 'amazonia' : i % 3 === 1 ? 'galapagos' : null;
      const tender = await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code,
          title: `Proceso adicional ${i}`,
          description: `Proceso de contratación adicional para datos de prueba`,
          status: i % 5 === 0 ? 'draft' : 'published',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          territoryPreference,
          estimatedAmount: 10000 + (i % 20) * 1000,
          publishedAt: i % 5 === 0 ? null : new Date(),
        },
      });
      bulkTenders++;
      const prov1 = providers[i % providers.length];
      const prov2 = providers[(i + 1) % providers.length];
      for (const prov of [prov1, prov2]) {
        const ex = await prisma.bid.findFirst({ where: { tenderId: tender.id, providerId: prov.id } });
        if (!ex) {
          await prisma.bid.create({
            data: { tenderId: tender.id, providerId: prov.id, amount: tender.estimatedAmount ?? 15000, status: 'submitted', submittedAt: new Date() },
          });
          bulkBids++;
        }
      }
    }
  }
  const publishedTenders = await prisma.tender.findMany({ where: { status: 'published' }, select: { id: true } });
  for (let i = 0; i < 50 && i < publishedTenders.length; i++) {
    const tenderId = publishedTenders[i].id;
    const entityForTender = await prisma.tender.findUnique({ where: { id: tenderId }, include: { procurementPlan: { select: { entityId: true } } } });
    const entityId = entityForTender?.procurementPlan?.entityId ?? null;
    const ex = await prisma.complaint.findFirst({ where: { tenderId } });
    if (!ex) await prisma.complaint.create({
      data: { tenderId, entityId, channel: 'WEB', category: 'TRANSPARENCIA', status: 'OPEN', summary: `Denuncia de prueba ${i}`, contactEmail: 'test@test.com' },
    });
  }
  for (let i = 0; i < 50 && i < publishedTenders.length; i++) {
    const tenderId = publishedTenders[i].id;
    const prov = providers[i % providers.length];
    const ex = await prisma.processClaim.findFirst({ where: { tenderId, providerId: prov.id } });
    if (!ex) await prisma.processClaim.create({
      data: { tenderId, providerId: prov.id, kind: 'EVALUATION', status: 'OPEN', subject: `Reclamo prueba ${i}`, message: 'Mensaje de prueba.' },
    });
  }
  for (let i = 0; i < 100 && i < publishedTenders.length; i++) {
    const tenderId = publishedTenders[i].id;
    const count = await prisma.tenderClarification.count({ where: { tenderId } });
    if (count < 3) await prisma.tenderClarification.create({
      data: { tenderId, status: i % 2 === 0 ? 'OPEN' : 'ANSWERED', question: `Pregunta adicional ${i}`, answer: i % 2 === 0 ? null : 'Respuesta de ejemplo.' },
    });
  }
  console.log(`  Bulk: ${bulkTenders} procesos, ${bulkBids} ofertas, 50 denuncias, 50 reclamos, 100 aclaraciones`);

  // OfferFormConfig (wizard de ofertas) por proceso – para pruebas E2E y admin Config. wizard
  const defaultOfferFormConfig = {
    processId: '',
    modality: 'LICITACION',
    version: '1',
    limits: { maxFileBytes: 20 * 1024 * 1024, maxTotalBytes: 100 * 1024 * 1024, allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'] },
    otp: { enabled: true, channels: ['SMS', 'EMAIL'], ttlSeconds: 600, maxAttempts: 5, cooldownSeconds: 60 },
    signature: { enabled: true, provider: 'STUB', mode: 'REMOTE' },
    steps: [
      { id: 'CONTACT', title: 'Contacto', enabled: true, fields: [] },
      { id: 'ECONOMIC', title: 'Oferta económica', enabled: true, fields: [] },
      { id: 'DOCUMENTS', title: 'Documentos', enabled: true, fields: [] },
      { id: 'REVIEW', title: 'Revisión y envío', enabled: true, fields: [] },
    ],
    documents: [
      { docType: 'FORMULARIO_OFERTA', label: 'Formulario de oferta', required: false, allowedExtensions: ['.pdf', '.doc', '.docx'] },
      { docType: 'DESGLOSE_ECONOMICO', label: 'Desglose económico', required: false, allowedExtensions: ['.pdf', '.xls', '.xlsx'] },
    ],
    constraints: { timeline: null, budgetRules: { hasReferenceBudget: false } },
  };
  for (const t of tenders) {
    const config = { ...defaultOfferFormConfig, processId: t.id } as Record<string, unknown>;
    const configJson = config as unknown as Prisma.InputJsonValue;
    await prisma.offerFormConfig.upsert({
      where: { processId: t.id },
      update: { modality: 'LICITACION', config: configJson },
      create: { processId: t.id, modality: 'LICITACION', config: configJson },
    });
  }
  console.log(`  OfferFormConfig para ${tenders.length} procesos (wizard de ofertas)`);

  // Auction (SIE) para el primer proceso – permite ejecutar pruebas E2E de Subasta Inversa
  const firstTenderForSie = tenders[0];
  await prisma.auction.upsert({
    where: { tenderId: firstTenderForSie.id },
    update: { status: 'INITIAL_WINDOW_OPEN', startAmount: firstTenderForSie.estimatedAmount ?? 35000 },
    create: {
      tenderId: firstTenderForSie.id,
      status: 'INITIAL_WINDOW_OPEN',
      currency: 'USD',
      startAmount: firstTenderForSie.estimatedAmount ?? 35000,
      currentRound: 1,
      initialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      biddingEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('  Auction SIE (INITIAL_WINDOW_OPEN) para primer proceso');

  // Contrato de ejemplo
  const firstTender = tenders[0];
  const firstBid = await prisma.bid.findFirst({ where: { tenderId: firstTender.id } });
  if (firstBid) {
    const contract = await prisma.contract.upsert({
      where: { tenderId: firstTender.id },
      update: {},
      create: {
        tenderId: firstTender.id,
        providerId: firstBid.providerId,
        contractNo: `CON-${year}-001`,
        status: 'signed',
        amount: firstBid.amount,
        signedAt: new Date(),
      },
    });
    console.log('  Contrato de ejemplo');

    // Pagos de contrato (hitos)
    const existingPayments = await prisma.contractPayment.count({ where: { contractId: contract.id } });
    if (existingPayments === 0) {
      await prisma.contractPayment.createMany({
        data: [
          {
            contractId: contract.id,
            sequenceNo: 1,
            status: 'planned',
            amount: (Number(firstBid.amount) || 0) * 0.3,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            contractId: contract.id,
            sequenceNo: 2,
            status: 'planned',
            amount: (Number(firstBid.amount) || 0) * 0.4,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            contractId: contract.id,
            sequenceNo: 3,
            status: 'planned',
            amount: (Number(firstBid.amount) || 0) * 0.3,
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        ],
      });
      console.log('  Pagos de contrato de ejemplo');
    }
  }

  // RAG chunks
  for (const chunk of RAG_CHUNKS) {
    const existing = await prisma.ragChunk.findFirst({ where: { title: chunk.title } });
    if (!existing) await prisma.ragChunk.create({ data: chunk });
  }
  console.log(`  ${RAG_CHUNKS.length} chunks RAG`);

  // Catálogo y orden de compra de ejemplo (primera entidad)
  const firstEnt = entities[0];
  let catalog = await prisma.catalog.findFirst({ where: { entityId: firstEnt.id, name: 'Catálogo de oficina' } });
  if (!catalog) {
    catalog = await prisma.catalog.create({
      data: { entityId: firstEnt.id, name: 'Catálogo de oficina', description: 'Ítems de papelería y suministros', status: 'published', publishedAt: new Date() },
    });
    await prisma.catalogItem.createMany({
      data: [
        { catalogId: catalog.id, cpcCode: '45110', name: 'Papel bond A4', unit: 'resma', referencePrice: 4.5, status: 'active' },
        { catalogId: catalog.id, cpcCode: '45200', name: 'Útiles de escritorio', unit: 'kit', referencePrice: 12, status: 'active' },
      ],
    });
    const po = await prisma.purchaseOrder.create({
      data: { entityId: firstEnt.id, catalogId: catalog.id, orderNo: `OC-${year}-001`, status: 'draft', totalAmount: 500 },
    });
    console.log('  Catálogo, ítems y orden de compra de ejemplo');
  }

  // Tender "primario" de la primera entidad (MEC) para E2E: contrato + aclaraciones; aparece primero al listar por entidad
  const firstEntity = entities[0];
  const primaryPlan = await prisma.procurementPlan.findFirst({
    where: { entityId: firstEntity.id, year },
  });
  const primaryTender = primaryPlan
    ? await prisma.tender.findFirst({
        where: { procurementPlanId: primaryPlan.id, status: 'published' },
        orderBy: { code: 'asc' },
      })
    : null;

  if (primaryTender) {
    await prisma.tender.update({
      where: { id: primaryTender.id },
      data: { publishedAt: new Date(Date.now() + 10000) },
    });
    let primaryBid = await prisma.bid.findFirst({ where: { tenderId: primaryTender.id } });
    if (!primaryBid) {
      const prov = providers[0];
      primaryBid = await prisma.bid.create({
        data: {
          tenderId: primaryTender.id,
          providerId: prov.id,
          amount: primaryTender.estimatedAmount ?? 40000,
          status: 'submitted',
          submittedAt: new Date(),
        },
      });
    }
    if (primaryBid) {
      const contract = await prisma.contract.upsert({
        where: { tenderId: primaryTender.id },
        update: {},
        create: {
          tenderId: primaryTender.id,
          providerId: primaryBid.providerId,
          contractNo: `CON-${year}-E2E`,
          status: 'signed',
          amount: primaryBid.amount,
          signedAt: new Date(),
        },
      });
      const existingPayments = await prisma.contractPayment.count({ where: { contractId: contract.id } });
      if (existingPayments === 0) {
        await prisma.contractPayment.createMany({
          data: [
            { contractId: contract.id, sequenceNo: 1, status: 'planned', amount: (Number(primaryBid.amount) || 0) * 0.3, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            { contractId: contract.id, sequenceNo: 2, status: 'planned', amount: (Number(primaryBid.amount) || 0) * 0.4, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
            { contractId: contract.id, sequenceNo: 3, status: 'planned', amount: (Number(primaryBid.amount) || 0) * 0.3, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          ],
        });
      }
      console.log('  Contrato y pagos en proceso primario (E2E)');
    }
  }

  // Denuncias y reclamos de ejemplo
  const sampleTender = primaryTender ?? (await prisma.tender.findFirst({
    where: { status: 'published' },
    include: { procurementPlan: { select: { entityId: true } } },
  }));
  const sampleProvider = providers[1] ?? providers[0];
  if (sampleTender && sampleProvider) {
    const entityId = sampleTender.procurementPlan?.entityId ?? null;
    const existingComplaints = await prisma.complaint.count({ where: { tenderId: sampleTender.id } });
    if (existingComplaints === 0) {
      await prisma.complaint.createMany({
        data: [
          {
            tenderId: sampleTender.id,
            entityId,
            providerId: null,
            channel: 'WEB',
            category: 'TRANSPARENCIA',
            status: 'OPEN',
            summary: 'Posible falta de publicación oportuna de documentos',
            details: 'No encuentro los pliegos completos asociados a este proceso en el portal.',
            contactEmail: 'denuncias@example.com',
            contactPhone: null,
          },
          {
            tenderId: sampleTender.id,
            entityId: null,
            providerId: sampleProvider.id,
            channel: 'WEB',
            category: 'INTEGRIDAD',
            status: 'UNDER_REVIEW',
            summary: 'Sospecha de conflicto de intereses en el proceso',
            details: 'Se observa relación entre adjudicatario y funcionario responsable.',
            contactEmail: 'proveedor@example.com',
            contactPhone: null,
          },
        ],
      });
      console.log('  Denuncias de ejemplo creadas');
    }

    const existingClaims = await prisma.processClaim.count({ where: { tenderId: sampleTender.id } });
    if (existingClaims === 0) {
      await prisma.processClaim.createMany({
        data: [
          {
            tenderId: sampleTender.id,
            providerId: sampleProvider.id,
            kind: 'EVALUATION',
            status: 'OPEN',
            subject: 'Revisión de puntaje técnico',
            message: 'Solicito revisar la calificación técnica asignada, considero que no se aplicaron correctamente los criterios.',
            response: null,
          },
          {
            tenderId: sampleTender.id,
            providerId: sampleProvider.id,
            kind: 'AWARD',
            status: 'UNDER_REVIEW',
            subject: 'Inconformidad con la adjudicación',
            message: 'La oferta adjudicada no parece ser la de mejor valor por dinero según los parámetros publicados.',
            response: null,
          },
        ],
      });
      console.log('  Reclamos de proceso de ejemplo creados');
    }

    const existingClarifications = await prisma.tenderClarification.count({ where: { tenderId: sampleTender.id } });
    if (existingClarifications === 0) {
      await prisma.tenderClarification.createMany({
        data: [
          {
            tenderId: sampleTender.id,
            askedByProviderId: sampleProvider.id,
            status: 'ANSWERED',
            question: '¿El plazo de entrega es calendario o hábil?',
            answer: 'El plazo es en días hábiles, según lo indicado en los pliegos.',
            askedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            answeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            tenderId: sampleTender.id,
            askedByProviderId: null,
            status: 'OPEN',
            question: '¿Se aceptan ofertas parciales por ítem?',
            answer: null,
            askedAt: new Date(),
            answeredAt: null,
          },
        ],
      });
      console.log('  Aclaraciones de proceso de ejemplo creadas');
    }
  }

  console.log('\nSeed OK. Datos de prueba tipo SERCOP listos.');
  console.log('  - Procesos publicados con códigos MEC-YYYY-CO-001, etc.');
  console.log('  - OfferFormConfig y Auction (SIE) creados para pruebas E2E.');
  console.log('  - Login entity: admin@mec.gob.ec');
  console.log('  - Login supplier: RUC 1791234567001 (TecEcuador)');
  console.log('  - Para batería E2E completa: npm run db:seed y luego npm run test:e2e:battery (con API en marcha).');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
