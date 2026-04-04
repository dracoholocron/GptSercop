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
  if (providers[1]) {
    await prisma.provider.update({
      where: { id: providers[1].id },
      data: { isCompliantSRI: false },
    });
    console.log('  Proveedor con isCompliantSRI false (E2E autoinvitación rechazada)');
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
      { title: 'Obra de construcción menor', description: 'Remodelación de área administrativa', method: 'open' as const, amount: 85000, processType: 'licitacion_obras' as const, regime: 'especial' as const, territoryPreference: null as const, minimumQuotes: null as number | null },
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

    // Licitación con apertura antigua – ventana de reclamos vencida (E2E claim window)
    const licitacionCode3 = `${entity.code}-${year}-CO-903`;
    if (entity.code === 'MEC' && !(await prisma.tender.findFirst({ where: { code: licitacionCode3 } }))) {
      const now = new Date();
      const bidsDeadlineOld = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const bidsOpenedOld = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code: licitacionCode3,
          title: 'Licitación – ventana reclamos vencida (E2E)',
          description: 'Proceso con apertura hace 10 días; plazo reclamos 3 días ya venció.',
          status: 'published',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 60000,
          referenceBudgetAmount: 60000,
          bidsDeadlineAt: bidsDeadlineOld,
          bidsOpenedAt: bidsOpenedOld,
          claimWindowDays: 3,
          responsibleType: 'delegate',
          electronicSignatureRequired: true,
          publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        },
      });
      tenderCount++;
      console.log('  Licitación ventana reclamos vencida (MEC-CO-903)');
    }

    // Licitación >500k para E2E validación patrimonio (proveedor sin patrimonio debe recibir 400)
    const licitacionCode4 = `${entity.code}-${year}-CO-904`;
    if (entity.code === 'MEC' && !(await prisma.tender.findFirst({ where: { code: licitacionCode4 } }))) {
      const now = new Date();
      const qDeadline = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
      const bDeadline = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
      await prisma.tender.create({
        data: {
          procurementPlanId: plan.id,
          code: licitacionCode4,
          title: 'Licitación >500k – E2E patrimonio',
          description: 'Proceso presupuesto referencial 600000 para prueba validación patrimonio.',
          status: 'published',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 600000,
          referenceBudgetAmount: 600000,
          questionsDeadlineAt: qDeadline,
          bidsDeadlineAt: bDeadline,
          responsibleType: 'commission',
          electronicSignatureRequired: true,
          publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      });
      tenderCount++;
      console.log('  Licitación >500k patrimonio (MEC-CO-904)');
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

  // ---- ANALYTICS SCENARIOS (Plataforma Analítica SERCOP) ----
  // Escenario A: proceso con un solo oferente (SINGLE_BIDDER pattern)
  const entitySercop = entities.find((e) => e.code === 'SERCOP') ?? entities[0];
  const providerA = providers[0];
  const providerB = providers[1];
  const providerC = providers[2];
  const providerD = providers[3];
  const providerE = providers[4] ?? providers[0];

  let analyticsPlan = await prisma.procurementPlan.findFirst({ where: { entityId: entitySercop.id, year } });
  if (!analyticsPlan) {
    analyticsPlan = await prisma.procurementPlan.create({
      data: { entityId: entitySercop.id, year, status: 'published', publishedAt: new Date(), totalAmount: 2000000 },
    });
  }

  // Escenario A: un solo oferente (SINGLE_BIDDER)
  const codeA = `SERCOP-${year}-AN-001`;
  let tenderA = await prisma.tender.findFirst({ where: { code: codeA } });
  if (!tenderA) {
    tenderA = await prisma.tender.create({
      data: {
        procurementPlanId: analyticsPlan.id,
        code: codeA,
        title: 'Consultoría sistemas informáticos – proceso analítico A',
        description: 'Proceso de análisis con un solo oferente para detección SINGLE_BIDDER.',
        status: 'awarded',
        procurementMethod: 'open',
        processType: 'licitacion',
        regime: 'ordinario',
        estimatedAmount: 120000,
        referenceBudgetAmount: 120000,
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  // Solo un bid para este proceso
  const existingBidsA = await prisma.bid.count({ where: { tenderId: tenderA.id } });
  if (existingBidsA === 0 && providerA) {
    await prisma.bid.create({
      data: {
        tenderId: tenderA.id,
        providerId: providerA.id,
        amount: 118000,
        status: 'submitted',
        submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    });
    const contractA = await prisma.contract.findFirst({ where: { tenderId: tenderA.id } });
    if (!contractA) {
      await prisma.contract.create({
        data: {
          tenderId: tenderA.id,
          providerId: providerA.id,
          contractNo: `${codeA}-CT`,
          status: 'active',
          amount: 118000,
          signedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('  Escenario A: proceso con un solo oferente (SERCOP-AN-001)');

  // Escenario B: proveedor dominante – providerA gana >40% contratos de la entidad
  const entityMec = entities.find((e) => e.code === 'MEC') ?? entities[0];
  let mecPlan = await prisma.procurementPlan.findFirst({ where: { entityId: entityMec.id, year } });
  if (!mecPlan) {
    mecPlan = await prisma.procurementPlan.create({
      data: { entityId: entityMec.id, year, status: 'published', publishedAt: new Date(), totalAmount: 800000 },
    });
  }
  const dominantCodes = [`MEC-${year}-AN-010`, `MEC-${year}-AN-011`, `MEC-${year}-AN-012`];
  for (const [i, dCode] of dominantCodes.entries()) {
    let tD = await prisma.tender.findFirst({ where: { code: dCode } });
    if (!tD) {
      tD = await prisma.tender.create({
        data: {
          procurementPlanId: mecPlan.id,
          code: dCode,
          title: `Suministros médicos dominante – lote ${i + 1}`,
          description: `Proceso ${dCode} para escenario proveedor dominante.`,
          status: 'awarded',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 80000 + i * 10000,
          referenceBudgetAmount: 80000 + i * 10000,
          publishedAt: new Date(Date.now() - (60 - i * 5) * 24 * 60 * 60 * 1000),
        },
      });
    }
    const bidsD = await prisma.bid.count({ where: { tenderId: tD.id } });
    if (bidsD === 0 && providerA && providerB) {
      await prisma.bid.createMany({
        data: [
          { tenderId: tD.id, providerId: providerA.id, amount: 78000 + i * 9000, status: 'submitted', submittedAt: new Date() },
          { tenderId: tD.id, providerId: providerB.id, amount: 82000 + i * 11000, status: 'submitted', submittedAt: new Date() },
        ],
      });
      const contractD = await prisma.contract.findFirst({ where: { tenderId: tD.id } });
      if (!contractD) {
        await prisma.contract.create({
          data: {
            tenderId: tD.id,
            providerId: providerA.id,
            contractNo: `${dCode}-CT`,
            status: 'active',
            amount: 78000 + i * 9000,
            signedAt: new Date(Date.now() - (50 - i * 5) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
  console.log('  Escenario B: proveedor dominante en MEC (3 contratos a mismo proveedor)');

  // Escenario C: contrato al 98% del presupuesto referencial (OVERPRICE pattern)
  const codeC = `SERCOP-${year}-AN-002`;
  let tenderC = await prisma.tender.findFirst({ where: { code: codeC } });
  if (!tenderC) {
    tenderC = await prisma.tender.create({
      data: {
        procurementPlanId: analyticsPlan.id,
        code: codeC,
        title: 'Adquisición equipos tecnológicos – proceso analítico C',
        description: 'Proceso para detección OVERPRICE: contrato al 98% del presupuesto.',
        status: 'awarded',
        procurementMethod: 'open',
        processType: 'licitacion',
        regime: 'ordinario',
        estimatedAmount: 200000,
        referenceBudgetAmount: 200000,
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
    });
  }
  const existingBidsC = await prisma.bid.count({ where: { tenderId: tenderC.id } });
  if (existingBidsC === 0 && providerB && providerC) {
    await prisma.bid.createMany({
      data: [
        { tenderId: tenderC.id, providerId: providerB.id, amount: 196000, status: 'submitted', submittedAt: new Date() },
        { tenderId: tenderC.id, providerId: providerC.id, amount: 199500, status: 'submitted', submittedAt: new Date() },
      ],
    });
    const contractC = await prisma.contract.findFirst({ where: { tenderId: tenderC.id } });
    if (!contractC) {
      await prisma.contract.create({
        data: {
          tenderId: tenderC.id,
          providerId: providerB.id,
          contractNo: `${codeC}-CT`,
          status: 'active',
          amount: 196000, // 98% de 200000 → OVERPRICE flag
          signedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('  Escenario C: contrato al 98% del presupuesto referencial (SERCOP-AN-002)');

  // Escenario D: desviación PAC vs ejecutado (entidad con 3 ítems PAC, solo 1 ejecutado)
  const entityIess = entities.find((e) => e.code === 'IESS') ?? entities[3];
  let iessPlan = await prisma.procurementPlan.findFirst({ where: { entityId: entityIess.id, year } });
  if (!iessPlan) {
    iessPlan = await prisma.procurementPlan.create({
      data: { entityId: entityIess.id, year, status: 'published', publishedAt: new Date(), totalAmount: 600000 },
    });
  }
  const pacDeviationCodes = [`IESS-${year}-AN-020`, `IESS-${year}-AN-021`, `IESS-${year}-AN-022`];
  for (const [i, pCode] of pacDeviationCodes.entries()) {
    let tPAC = await prisma.tender.findFirst({ where: { code: pCode } });
    if (!tPAC) {
      // Solo el primer proceso se ejecuta (published → awarded); los otros quedan en draft
      await prisma.tender.create({
        data: {
          procurementPlanId: iessPlan.id,
          code: pCode,
          title: `Plan anual IESS – ítem ${i + 1}`,
          description: `Proceso ${pCode} para escenario desviación PAC.`,
          status: i === 0 ? 'awarded' : 'draft',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 150000,
          publishedAt: i === 0 ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }
  console.log('  Escenario D: desviación PAC vs ejecutado en IESS (1 de 3 procesos ejecutado)');

  // ---- ANALYTICS SCENARIOS FASE 2 ----

  // Escenario E: proceso muy rápido (FAST_PROCESS) – adjudicado en 3 días
  const codeE = `SERCOP-${year}-AN-003`;
  let tenderE = await prisma.tender.findFirst({ where: { code: codeE } });
  if (!tenderE) {
    const pubDateE = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const signDateE = new Date(pubDateE.getTime() + 3 * 24 * 60 * 60 * 1000); // solo 3 días
    tenderE = await prisma.tender.create({
      data: {
        procurementPlanId: analyticsPlan.id,
        code: codeE,
        title: 'Servicios de consultoría express – proceso analítico E',
        description: 'Proceso para detección FAST_PROCESS: adjudicado en 3 días hábiles.',
        status: 'awarded',
        procurementMethod: 'direct',
        processType: 'contratacion_directa',
        regime: 'ordinario',
        estimatedAmount: 50000,
        referenceBudgetAmount: 50000,
        publishedAt: pubDateE,
      },
    });
    const existingBidsE = await prisma.bid.count({ where: { tenderId: tenderE.id } });
    if (existingBidsE === 0 && providerA) {
      await prisma.bid.create({
        data: { tenderId: tenderE.id, providerId: providerA.id, amount: 49000, status: 'submitted', submittedAt: pubDateE },
      });
      const contractE = await prisma.contract.findFirst({ where: { tenderId: tenderE.id } });
      if (!contractE) {
        await prisma.contract.create({
          data: { tenderId: tenderE.id, providerId: providerA.id, contractNo: `${codeE}-CT`, status: 'active', amount: 49000, signedAt: signDateE },
        });
      }
    }
  }
  console.log('  Escenario E: proceso muy rápido – adjudicado en 3 días (SERCOP-AN-003)');

  // Escenario F: 4 contratos fragmentados misma entidad misma semana (FRAGMENTATION)
  const fragmentCodes = [`SERCOP-${year}-AN-010`, `SERCOP-${year}-AN-011`, `SERCOP-${year}-AN-012`, `SERCOP-${year}-AN-013`];
  const baseDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (const [i, fCode] of fragmentCodes.entries()) {
    let tF = await prisma.tender.findFirst({ where: { code: fCode } });
    if (!tF) {
      const pubF = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      tF = await prisma.tender.create({
        data: {
          procurementPlanId: analyticsPlan.id,
          code: fCode,
          title: `Suministros de oficina fragmentado – lote ${i + 1}`,
          description: `Proceso ${fCode} para escenario FRAGMENTATION.`,
          status: 'awarded',
          procurementMethod: 'direct',
          processType: 'infima_cuantia',
          regime: 'ordinario',
          estimatedAmount: 4800,
          referenceBudgetAmount: 4800,
          publishedAt: pubF,
        },
      });
      if (providerC) {
        await prisma.bid.create({
          data: { tenderId: tF.id, providerId: providerC.id, amount: 4700, status: 'submitted', submittedAt: pubF },
        });
        const contractF = await prisma.contract.findFirst({ where: { tenderId: tF.id } });
        if (!contractF) {
          await prisma.contract.create({
            data: { tenderId: tF.id, providerId: providerC.id, contractNo: `${fCode}-CT`, status: 'active', amount: 4700, signedAt: new Date(pubF.getTime() + 24 * 60 * 60 * 1000) },
          });
        }
      }
    }
  }
  console.log('  Escenario F: 4 contratos fragmentados en 1 semana (SERCOP-AN-010..013)');

  // Escenario G: empresa nueva gana contrato grande (NEW_COMPANY)
  const newCompanyProvider = await (async () => {
    const existing = await prisma.provider.findFirst({ where: { identifier: '1799000001001' } });
    if (existing) return existing;
    return prisma.provider.create({
      data: {
        name: 'Startup Tecnológica Reciente S.A.',
        identifier: '1799000001001',
        legalName: 'Startup Tecnológica Reciente Sociedad Anónima',
        tradeName: 'StartupTec',
        status: 'active',
        province: 'Pichincha',
        canton: 'Quito',
        legalEstablishmentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // hace 60 días
      },
    });
  })();
  const codeG = `SERCOP-${year}-AN-004`;
  let tenderG = await prisma.tender.findFirst({ where: { code: codeG } });
  if (!tenderG) {
    tenderG = await prisma.tender.create({
      data: {
        procurementPlanId: analyticsPlan.id,
        code: codeG,
        title: 'Plataforma tecnológica nacional – proceso analítico G',
        description: 'Proceso para detección NEW_COMPANY: empresa con < 1 año gana contrato grande.',
        status: 'awarded',
        procurementMethod: 'open',
        processType: 'licitacion',
        regime: 'ordinario',
        estimatedAmount: 350000,
        referenceBudgetAmount: 350000,
        publishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.bid.create({
      data: { tenderId: tenderG.id, providerId: newCompanyProvider.id, amount: 340000, status: 'submitted', submittedAt: new Date() },
    });
    const contractG = await prisma.contract.findFirst({ where: { tenderId: tenderG.id } });
    if (!contractG) {
      await prisma.contract.create({
        data: { tenderId: tenderG.id, providerId: newCompanyProvider.id, contractNo: `${codeG}-CT`, status: 'active', amount: 340000, signedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
      });
    }
  }
  console.log('  Escenario G: empresa creada hace 60 días gana contrato de $340k (SERCOP-AN-004)');

  // Escenario H: entidad con 5 contratos de emergencia en 2 meses (EMERGENCY_ABUSE)
  const entityMsp = entities.find((e) => e.code === 'MSP') ?? entities[1];
  let mspPlan = await prisma.procurementPlan.findFirst({ where: { entityId: entityMsp.id, year } });
  if (!mspPlan) {
    mspPlan = await prisma.procurementPlan.create({
      data: { entityId: entityMsp.id, year, status: 'published', publishedAt: new Date(), totalAmount: 500000 },
    });
  }
  const emergencyCodes = Array.from({ length: 5 }, (_, i) => `MSP-${year}-AN-030${i + 1}`);
  for (const [i, eCode] of emergencyCodes.entries()) {
    if (!(await prisma.tender.findFirst({ where: { code: eCode } }))) {
      const tEmerg = await prisma.tender.create({
        data: {
          procurementPlanId: mspPlan.id,
          code: eCode,
          title: `Emergencia sanitaria – suministro ${i + 1}`,
          description: `Proceso ${eCode} emergencia para detección EMERGENCY_ABUSE.`,
          status: 'awarded',
          procurementMethod: 'direct',
          processType: 'contratacion_directa',
          regime: 'emergencia',
          estimatedAmount: 30000 + i * 5000,
          referenceBudgetAmount: 30000 + i * 5000,
          publishedAt: new Date(Date.now() - (55 - i * 10) * 24 * 60 * 60 * 1000),
        },
      });
      if (providerE) {
        await prisma.bid.create({
          data: { tenderId: tEmerg.id, providerId: providerE.id, amount: 29000 + i * 4800, status: 'submitted', submittedAt: new Date() },
        });
        const contractEmerg = await prisma.contract.findFirst({ where: { tenderId: tEmerg.id } });
        if (!contractEmerg) {
          await prisma.contract.create({
            data: { tenderId: tEmerg.id, providerId: providerE.id, contractNo: `${eCode}-CT`, status: 'active', amount: 29000 + i * 4800, signedAt: new Date(Date.now() - (50 - i * 10) * 24 * 60 * 60 * 1000) },
          });
        }
      }
    }
  }
  console.log('  Escenario H: 5 contratos de emergencia en MSP en 2 meses (MSP-AN-0301..0305)');

  // Escenario I: 3 ContractAmendments en mismo contrato (FREQUENT_AMENDMENTS)
  const codeI = `SERCOP-${year}-AN-005`;
  let tenderI = await prisma.tender.findFirst({ where: { code: codeI } });
  if (!tenderI) {
    tenderI = await prisma.tender.create({
      data: {
        procurementPlanId: analyticsPlan.id,
        code: codeI,
        title: 'Obra de infraestructura con modificaciones – proceso analítico I',
        description: 'Proceso para detección FREQUENT_AMENDMENTS: 3 modificaciones contractuales.',
        status: 'awarded',
        procurementMethod: 'open',
        processType: 'licitacion_obras',
        regime: 'ordinario',
        estimatedAmount: 500000,
        referenceBudgetAmount: 500000,
        publishedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    });
    if (providerD) {
      await prisma.bid.create({
        data: { tenderId: tenderI.id, providerId: providerD.id, amount: 490000, status: 'submitted', submittedAt: new Date() },
      });
    }
  }
  const contractI = await prisma.contract.findFirst({ where: { tenderId: tenderI.id } });
  const contractIRecord = contractI ?? (providerD ? await prisma.contract.create({
    data: { tenderId: tenderI.id, providerId: providerD.id, contractNo: `${codeI}-CT`, status: 'active', amount: 490000, signedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
  }) : null);
  if (contractIRecord) {
    const existingAmendments = await prisma.contractAmendment.count({ where: { contractId: contractIRecord.id } });
    if (existingAmendments === 0) {
      await prisma.contractAmendment.createMany({
        data: [
          { contractId: contractIRecord.id, amendmentNo: 1, changeType: 'PLAZO', reason: 'Retraso en entrega de materiales', valueBefore: null, valueAfter: null, approvedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) },
          { contractId: contractIRecord.id, amendmentNo: 2, changeType: 'MONTO', valueBefore: new Prisma.Decimal(490000), valueAfter: new Prisma.Decimal(535000), reason: 'Incremento por obras adicionales', approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          { contractId: contractIRecord.id, amendmentNo: 3, changeType: 'PLAZO', reason: 'Segunda extensión de plazo por condiciones climáticas', valueBefore: null, valueAfter: null, approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        ],
      });
      console.log('  Escenario I: 3 ContractAmendments en contrato SERCOP-AN-005');
    }
  }

  // ---- ANALYTICS SCENARIOS FASE 3 – Colusión ----

  // Escenario J: providers[0] y providers[1] compiten juntos en 5 procesos (COLLUSION_CANDIDATE)
  const collusionCodes = Array.from({ length: 5 }, (_, i) => `SERCOP-${year}-AN-02${i}`);
  for (const [i, jCode] of collusionCodes.entries()) {
    if (!(await prisma.tender.findFirst({ where: { code: jCode } }))) {
      const tJ = await prisma.tender.create({
        data: {
          procurementPlanId: analyticsPlan.id,
          code: jCode,
          title: `Licitación suministros generales – cluster ${i + 1}`,
          description: `Proceso ${jCode} para escenario colusión J: providerA y providerB compiten juntos.`,
          status: 'awarded',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 60000 + i * 5000,
          referenceBudgetAmount: 60000 + i * 5000,
          publishedAt: new Date(Date.now() - (100 + i * 15) * 24 * 60 * 60 * 1000),
        },
      });
      if (providerA && providerB) {
        const winner = i % 2 === 0 ? providerA : providerB;
        const loser = i % 2 === 0 ? providerB : providerA;
        await prisma.bid.createMany({
          data: [
            { tenderId: tJ.id, providerId: winner.id, amount: 58000 + i * 4800, status: 'submitted', submittedAt: new Date() },
            { tenderId: tJ.id, providerId: loser.id, amount: 61000 + i * 5100, status: 'submitted', submittedAt: new Date() },
          ],
        });
        const contractJ = await prisma.contract.findFirst({ where: { tenderId: tJ.id } });
        if (!contractJ) {
          await prisma.contract.create({
            data: { tenderId: tJ.id, providerId: winner.id, contractNo: `${jCode}-CT`, status: 'active', amount: 58000 + i * 4800, signedAt: new Date(Date.now() - (90 + i * 15) * 24 * 60 * 60 * 1000) },
          });
        }
      }
    }
  }
  console.log('  Escenario J: providerA y providerB compiten juntos en 5 procesos (colusión)');

  // Escenario K: cluster de 3 proveedores (providerA, providerB, providerC) en 4 procesos
  const clusterCodes = Array.from({ length: 4 }, (_, i) => `SERCOP-${year}-AN-03${i}`);
  for (const [i, kCode] of clusterCodes.entries()) {
    if (!(await prisma.tender.findFirst({ where: { code: kCode } }))) {
      const tK = await prisma.tender.create({
        data: {
          procurementPlanId: analyticsPlan.id,
          code: kCode,
          title: `Servicios técnicos – triángulo colusión ${i + 1}`,
          description: `Proceso ${kCode} para escenario cluster K.`,
          status: 'awarded',
          procurementMethod: 'open',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: 70000 + i * 8000,
          referenceBudgetAmount: 70000 + i * 8000,
          publishedAt: new Date(Date.now() - (150 + i * 20) * 24 * 60 * 60 * 1000),
        },
      });
      if (providerA && providerB && providerC) {
        const winners = [providerA, providerB, providerC, providerA];
        const winner = winners[i];
        await prisma.bid.createMany({
          data: [
            { tenderId: tK.id, providerId: providerA.id, amount: 68000 + i * 7800, status: 'submitted', submittedAt: new Date() },
            { tenderId: tK.id, providerId: providerB.id, amount: 72000 + i * 8200, status: 'submitted', submittedAt: new Date() },
            { tenderId: tK.id, providerId: providerC.id, amount: 71000 + i * 8100, status: 'submitted', submittedAt: new Date() },
          ],
        });
        const contractK = await prisma.contract.findFirst({ where: { tenderId: tK.id } });
        if (!contractK) {
          await prisma.contract.create({
            data: { tenderId: tK.id, providerId: winner.id, contractNo: `${kCode}-CT`, status: 'active', amount: 68000 + i * 7800, signedAt: new Date(Date.now() - (140 + i * 20) * 24 * 60 * 60 * 1000) },
          });
        }
      }
    }
  }
  console.log('  Escenario K: triángulo colusión – 3 proveedores en 4 procesos (SERCOP-AN-030..033)');

  console.log('\nSeed OK. Datos de prueba tipo SERCOP listos.');
  console.log('  - Procesos publicados con códigos MEC-YYYY-CO-001, etc.');
  console.log('  - OfferFormConfig y Auction (SIE) creados para pruebas E2E.');
  console.log('  - Login entity: admin@mec.gob.ec');
  console.log('  - Login supplier: RUC 1791234567001 (TecEcuador)');
  console.log('  - Analytics escenarios: SERCOP-AN-001 (single bidder), SERCOP-AN-002 (overprice), SERCOP-AN-003 (fast process)');
  console.log('  - Analytics riesgo: SERCOP-AN-010..013 (fragmentación), SERCOP-AN-004 (new company), MSP-AN-030x (emergencias)');
  console.log('  - Analytics colusión: SERCOP-AN-020..024 (pares), SERCOP-AN-030..033 (triángulo)');
  console.log('  - Para batería E2E completa: npm run db:seed y luego npm run test:e2e:battery (con API en marcha).');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
