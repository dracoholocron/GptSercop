import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ENTITIES = [
  { name: 'Ministerio de Educación', code: 'MEC', legalName: 'Ministerio de Educación del Ecuador', organizationType: 'ministerio' },
  { name: 'Ministerio de Salud Pública', code: 'MSP', legalName: 'Ministerio de Salud Pública del Ecuador', organizationType: 'ministerio' },
  { name: 'Municipio de Quito', code: 'GAD-Q', legalName: 'Municipio del Distrito Metropolitano de Quito', organizationType: 'gad' },
  { name: 'Instituto Ecuatoriano de Seguridad Social', code: 'IESS', legalName: 'IESS', organizationType: 'institucion' },
  { name: 'Entidad Ejemplo', code: 'ENT001', legalName: 'Entidad de Prueba', organizationType: 'otro' },
];

const PROVIDERS = [
  { name: 'Tecnología Ecuador S.A.', identifier: '1791234567001', legalName: 'Tecnología Ecuador Sociedad Anónima', tradeName: 'TecEcuador', province: 'Pichincha', canton: 'Quito', address: 'Av. Amazonas N23-45' },
  { name: 'Suministros Industriales Cía. Ltda.', identifier: '1792345678001', legalName: 'Suministros Industriales Compañía Limitada', tradeName: 'SumInd', province: 'Guayas', canton: 'Guayaquil', address: 'Av. 9 de Octubre 123' },
  { name: 'Construcciones Andinas S.A.', identifier: '1793456789001', legalName: 'Construcciones Andinas Sociedad Anónima', tradeName: 'ConstAndinas', province: 'Pichincha', canton: 'Quito', address: 'Av. de los Shyris' },
  { name: 'Servicios de Limpieza Pro', identifier: '1794567890001', legalName: 'Servicios de Limpieza Profesional', tradeName: 'LimpiezaPro', province: 'Azuay', canton: 'Cuenca', address: 'Calle Larga 456' },
  { name: 'Equipos Médicos del Ecuador', identifier: '1795678901001', legalName: 'Equipos Médicos del Ecuador S.A.', tradeName: 'EquipMed', province: 'Pichincha', canton: 'Quito', address: 'Av. República del Salvador' },
];

const RAG_CHUNKS = [
  { title: 'LOSNCP – Ley Orgánica del Sistema Nacional de Contratación Pública', content: `La Ley Orgánica del Sistema Nacional de Contratación Pública (LOSNCP) regula la contratación pública en Ecuador. Establece los principios de transparencia, competencia, eficiencia y responsabilidad. El sistema de contratación pública comprende los procesos de contratación de bienes, servicios, obras y consultorías. Las entidades contratantes deben publicar sus procesos en el portal único.`, source: 'normativa', documentType: 'ley', url: null as string | null },
  { title: 'Reglamento General a la LOSNCP', content: `El Reglamento General desarrolla las disposiciones de la LOSNCP. Define los procedimientos de contratación: concurso de ofertas, cotización, licitación. Establece los umbrales y montos para cada tipo de proceso. Los proveedores deben estar inscritos en el RUP (Registro Único de Proveedores).`, source: 'normativa', documentType: 'reglamento', url: null as string | null },
  { title: 'Manual de Contratación Pública', content: `El manual de contratación pública es una guía para entidades y proveedores. Explica cómo registrar ofertas, presentar documentos y participar en procesos. Incluye preguntas frecuentes sobre el PAC (Plan Anual de Contratación). Los procesos de contratación deben respetar los plazos establecidos.`, source: 'manuales', documentType: 'manual', url: null as string | null },
  { title: 'Resolución SERCOP – Catálogo electrónico', content: `Las resoluciones del SERCOP regulan aspectos específicos del sistema. El catálogo electrónico permite la adquisición de bienes y servicios de bajo monto. Los proveedores deben mantener actualizada su información en el RUP.`, source: 'resoluciones', documentType: 'resolucion', url: null as string | null },
  { title: 'Procedimiento de contratación directa', content: `La contratación directa aplica cuando el monto no supera los umbrales establecidos. El proveedor debe estar inscrito en el RUP. La entidad debe justificar la selección del proveedor.`, source: 'normativa', documentType: 'guia', url: null as string | null },
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

  // PAC y Tenders por entidad
  let tenderCount = 0;
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
      { title: 'Compra de equipos de cómputo', description: 'Adquisición de laptops y computadoras para oficinas', method: 'open' as const, amount: 45000 },
      { title: 'Servicios de limpieza anual', description: 'Contratación de servicios de aseo para instalaciones', method: 'direct' as const, amount: 12000 },
      { title: 'Suministro de material de oficina', description: 'Papelería, útiles y consumibles', method: 'catalog' as const, amount: 5000 },
      { title: 'Mantenimiento de equipos médicos', description: 'Servicio técnico especializado', method: 'open' as const, amount: 28000 },
      { title: 'Obra de construcción menor', description: 'Remodelación de área administrativa', method: 'open' as const, amount: 85000 },
    ];

    for (const t of tendersData) {
      const existing = await prisma.tender.findFirst({
        where: { procurementPlanId: plan.id, title: t.title },
      });
      if (!existing) {
        await prisma.tender.create({
          data: {
            procurementPlanId: plan.id,
            title: t.title,
            description: t.description,
            status: 'published',
            procurementMethod: t.method,
            estimatedAmount: t.amount,
            publishedAt: new Date(),
          },
        });
        tenderCount++;
      }
    }
  }
  console.log(`  PAC y ${tenderCount} procesos de contratación`);

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

  // Contrato de ejemplo
  const firstTender = tenders[0];
  const firstBid = await prisma.bid.findFirst({ where: { tenderId: firstTender.id } });
  if (firstBid) {
    await prisma.contract.upsert({
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
  }

  // RAG chunks
  for (const chunk of RAG_CHUNKS) {
    const existing = await prisma.ragChunk.findFirst({ where: { title: chunk.title } });
    if (!existing) await prisma.ragChunk.create({ data: chunk });
  }
  console.log(`  ${RAG_CHUNKS.length} chunks RAG`);

  console.log('\nSeed OK. Datos de prueba listos para todos los escenarios.');
  console.log('  - Login entity: admin@mec.gob.ec (seleccionar Ministerio de Educación)');
  console.log('  - Login supplier: usar RUC 1791234567001 para vincular proveedor');
  console.log('  - Registro: crear nuevo proveedor en /registro');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
