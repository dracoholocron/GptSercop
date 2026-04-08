import { PrismaClient } from '../generated/client/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Agent SOCE database...');

  // ─── Roles ───────────────────────────────────────────────
  const adminRole = await prisma.agentRole.upsert({
    where: { name: 'agent_admin' },
    update: {},
    create: { name: 'agent_admin', description: 'Full admin access to Agent SOCE', isSystem: true },
  });

  const analystRole = await prisma.agentRole.upsert({
    where: { name: 'analyst' },
    update: {},
    create: { name: 'analyst', description: 'Can query all data sources', isSystem: true },
  });

  const entityRole = await prisma.agentRole.upsert({
    where: { name: 'entity_user' },
    update: {},
    create: { name: 'entity_user', description: 'Entity-scoped access' },
  });

  const providerRole = await prisma.agentRole.upsert({
    where: { name: 'provider_user' },
    update: {},
    create: { name: 'provider_user', description: 'Provider-scoped access' },
  });

  console.log('  ✓ Roles created');

  // ─── Users ───────────────────────────────────────────────
  // Admin users get a passwordHash so they can log in to the Admin Console
  const adminDefaultPassword = process.env.AGENT_SOCE_ADMIN_PASSWORD ?? 'admin123';
  const adminHash = await bcrypt.hash(adminDefaultPassword, 12);

  const users = [
    { externalId: 'admin-001', email: 'admin@sercop.gob.ec', displayName: 'Admin SOCE', roleId: adminRole.id, passwordHash: adminHash },
    { externalId: 'analyst-001', email: 'analyst@sercop.gob.ec', displayName: 'Ana Analista', roleId: analystRole.id, passwordHash: null },
    { externalId: 'entity-001', email: 'entity@msp.gob.ec', displayName: 'Carlos Entidad MSP', roleId: entityRole.id, passwordHash: null },
    { externalId: 'entity-002', email: 'entity2@mineduc.gob.ec', displayName: 'Diana Entidad MINEDUC', roleId: entityRole.id, passwordHash: null },
    { externalId: 'provider-001', email: 'prov@proveedores.com', displayName: 'Proveedor Tech S.A.', roleId: providerRole.id, passwordHash: null },
    { externalId: 'provider-002', email: 'prov2@medical.com', displayName: 'Proveedor Medical Corp', roleId: providerRole.id, passwordHash: null },
  ];

  for (const u of users) {
    const user = await prisma.agentUser.upsert({
      where: { externalId: u.externalId },
      update: u.passwordHash ? { passwordHash: u.passwordHash } : {},
      create: { externalId: u.externalId, email: u.email, displayName: u.displayName, passwordHash: u.passwordHash },
    });
    await prisma.agentUserRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: u.roleId } },
      update: {},
      create: { userId: user.id, roleId: u.roleId },
    });
  }
  console.log('  ✓ Users created');

  // ─── Data Sources ────────────────────────────────────────
  const txDs = await prisma.agentDataSource.upsert({
    where: { name: 'sercop_transactional' },
    update: {},
    create: {
      name: 'sercop_transactional',
      type: 'postgresql',
      connectionUrl: process.env.HOST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/sercop',
      schema: 'public',
      maxPoolSize: 5,
      timeoutMs: 10000,
    },
  });

  const martDs = await prisma.agentDataSource.upsert({
    where: { name: 'analytics_mart' },
    update: {},
    create: {
      name: 'analytics_mart',
      type: 'postgresql',
      connectionUrl: process.env.MART_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/sercop',
      schema: 'public',
      maxPoolSize: 3,
      timeoutMs: 10000,
    },
  });

  console.log('  ✓ Data sources created');

  // ─── Permissions ─────────────────────────────────────────
  const permissionsData = [
    { roleId: analystRole.id, dataSourceId: txDs.id, tableName: '*', allowedColumns: [], accessLevel: 'read' },
    { roleId: analystRole.id, dataSourceId: martDs.id, tableName: '*', allowedColumns: [], accessLevel: 'read' },
    { roleId: entityRole.id, dataSourceId: txDs.id, tableName: 'Tender', allowedColumns: [], rowFilter: '"entityId" = :userEntityId', accessLevel: 'read' },
    { roleId: entityRole.id, dataSourceId: txDs.id, tableName: 'Contract', allowedColumns: [], rowFilter: '"entityId" = :userEntityId', accessLevel: 'read' },
    { roleId: providerRole.id, dataSourceId: txDs.id, tableName: 'Bid', allowedColumns: [], rowFilter: '"providerId" = :userProviderId', accessLevel: 'read' },
    { roleId: providerRole.id, dataSourceId: txDs.id, tableName: 'Contract', allowedColumns: [], rowFilter: '"providerId" = :userProviderId', accessLevel: 'read' },
  ];

  for (const p of permissionsData) {
    await prisma.agentDataPermission.upsert({
      where: {
        roleId_dataSourceId_tableName: {
          roleId: p.roleId,
          dataSourceId: p.dataSourceId,
          tableName: p.tableName,
        },
      },
      update: {},
      create: p,
    });
  }
  console.log('  ✓ Permissions created');

  // ─── LLM Provider ───────────────────────────────────────
  await prisma.agentLLMProvider.upsert({
    where: { name: 'ollama-local' },
    update: {},
    create: {
      name: 'ollama-local',
      type: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
      model: 'llama3.2:3b',
      isDefault: true,
      isActive: true,
      maxTokens: 4096,
      temperature: 0.3,
      metadata: { embeddingModel: 'nomic-embed-text' },
    },
  });
  console.log('  ✓ LLM provider created');

  // ─── RAG Config ──────────────────────────────────────────
  const ragCount = await prisma.agentRAGConfig.count();
  if (ragCount === 0) {
    await prisma.agentRAGConfig.create({ data: {} });
  }
  console.log('  ✓ RAG config created');

  // ─── Graph Config ────────────────────────────────────────
  const graphCount = await prisma.agentGraphConfig.count();
  if (graphCount === 0) {
    await prisma.agentGraphConfig.create({ data: {} });
  }
  console.log('  ✓ Graph config created');

  // ─── Theme Config ────────────────────────────────────────
  await prisma.agentThemeConfig.upsert({
    where: { name: 'sercop' },
    update: {},
    create: {
      name: 'sercop',
      isActive: true,
      primaryColor: '#0073E6',
      secondaryColor: '#FFB800',
      accentColor: '#10B981',
      buttonLabel: 'Agent SOCE',
    },
  });
  console.log('  ✓ Theme config created');

  // ─── General Config ──────────────────────────────────────
  const genCount = await prisma.agentGeneralConfig.count();
  if (genCount === 0) {
    await prisma.agentGeneralConfig.create({ data: {} });
  }
  console.log('  ✓ General config created');

  // ─── RAG Chunks (normative content) ─────────────────────
  const ragChunks = [
    { title: 'Ley Orgánica del SNCP - Art. 1', content: 'La presente Ley establece el Sistema Nacional de Contratación Pública y determina los principios y normas para regular los procedimientos de contratación para la adquisición o arrendamiento de bienes, ejecución de obras y prestación de servicios.', source: 'LOSNCP', documentType: 'normativa' },
    { title: 'Subasta Inversa Electrónica', content: 'La subasta inversa electrónica se utilizará cuando las entidades contratantes requieran adquirir bienes y servicios normalizados cuya cuantía supere el monto equivalente al 0.0000002 del Presupuesto Inicial del Estado, no se podrá emplear este procedimiento para la contratación de consultoría.', source: 'LOSNCP Art. 47', documentType: 'normativa' },
    { title: 'Catálogo Electrónico', content: 'Las Entidades Contratantes están obligadas a consultar el catálogo electrónico previamente a establecer procesos de adquisición de bienes y servicios. El catálogo electrónico es la herramienta informática a través de la cual las entidades contratantes pueden realizar adquisiciones directas de bienes y servicios normalizados.', source: 'LOSNCP Art. 46', documentType: 'normativa' },
    { title: 'Contratación Directa', content: 'La contratación directa procede en los casos previstos en la ley, como situaciones de emergencia, única fuente, o cuando el monto no supere los umbrales establecidos. El procedimiento debe cumplir con los principios de transparencia y mejor uso de recursos públicos.', source: 'RGLOSNCP', documentType: 'normativa' },
    { title: 'Cotización', content: 'El procedimiento de cotización se utiliza para la contratación de bienes, servicios u obras cuyo presupuesto referencial oscile entre el 0.000002 y el 0.000015 del Presupuesto Inicial del Estado. Requiere la invitación a un mínimo de cinco proveedores registrados en el RUP.', source: 'LOSNCP Art. 50', documentType: 'normativa' },
    { title: 'Licitación', content: 'La licitación es el procedimiento de contratación que se utiliza cuando el presupuesto referencial supera el monto equivalente al 0.000015 del Presupuesto Inicial del Estado. Requiere publicación en el portal de compras públicas y permite la participación de cualquier proveedor habilitado.', source: 'LOSNCP Art. 48', documentType: 'normativa' },
    { title: 'Registro Único de Proveedores (RUP)', content: 'Para ser proveedor del Estado se requiere estar inscrito y habilitado en el Registro Único de Proveedores (RUP) del SERCOP. El RUP es la base de datos de todos los proveedores habilitados para participar en los procesos de contratación pública.', source: 'LOSNCP Art. 16', documentType: 'normativa' },
    { title: 'Plan Anual de Contratación (PAC)', content: 'Las entidades contratantes, para cumplir con los objetivos del Plan Nacional de Desarrollo, sus objetivos y necesidades institucionales, formularán el Plan Anual de Contratación con el presupuesto correspondiente. El PAC debe ser publicado en el portal de compras públicas.', source: 'LOSNCP Art. 22', documentType: 'normativa' },
    { title: 'Principios de Contratación Pública', content: 'Los principios que rigen la contratación pública son: legalidad, trato justo, igualdad, calidad, vigencia tecnológica, oportunidad, concurrencia, transparencia, publicidad y participación nacional.', source: 'LOSNCP Art. 4', documentType: 'normativa' },
    { title: 'Menor Cuantía', content: 'Se podrá contratar bajo el sistema de menor cuantía en los siguientes casos: la contratación de bienes y servicios no normalizados cuyo presupuesto referencial sea inferior al 0.000002 del PIE, y la contratación de obras cuyo presupuesto referencial sea inferior al 0.000007 del PIE.', source: 'LOSNCP Art. 51', documentType: 'normativa' },
    { title: 'Ínfima Cuantía', content: 'Las contrataciones de ínfima cuantía se las realizará de forma directa con un proveedor seleccionado por la entidad contratante sin que sea necesario que esté habilitado en el RUP, cuando el monto no supere el valor que resulte de multiplicar el coeficiente 0.0000002 por el PIE.', source: 'LOSNCP Art. 52.1', documentType: 'normativa' },
    { title: 'Régimen Especial', content: 'Se someterán a la normativa específica que para el efecto dicte el Presidente de la República, los procedimientos precontractuales de: adquisición de fármacos, seguridad interna y externa, comunicación social, asesoría y patrocinio jurídico, obra artística, literaria o científica.', source: 'LOSNCP Art. 2', documentType: 'normativa' },
    { title: 'Garantías', content: 'En los contratos de ejecución de obras, adquisición de bienes o prestación de servicios, el contratista deberá rendir garantías: de fiel cumplimiento por el 5% del monto del contrato y garantía técnica para asegurar la calidad de los bienes o servicios.', source: 'LOSNCP Art. 73-76', documentType: 'normativa' },
    { title: 'Evaluación de Ofertas', content: 'La evaluación de las ofertas se realizará aplicando los parámetros de calificación previstos en los pliegos. Se evaluarán aspectos como la propuesta técnica, propuesta económica, experiencia del oferente y del personal técnico, y cumplimiento de especificaciones técnicas.', source: 'RGLOSNCP', documentType: 'normativa' },
    { title: 'Terminación de Contratos', content: 'Los contratos podrán terminar por: cumplimiento de las obligaciones contractuales, mutuo acuerdo de las partes, sentencia o laudo ejecutoriados, declaración unilateral del contratante, o muerte del contratista.', source: 'LOSNCP Art. 92', documentType: 'normativa' },
    { title: 'Proceso de Creación de Proceso', content: 'Para crear un nuevo proceso de contratación en SERCOP, el usuario debe: 1) Ir a Procesos > Nuevo Proceso, 2) Seleccionar el tipo de contratación, 3) Completar la información general (objeto, presupuesto referencial, partida presupuestaria), 4) Agregar los pliegos y documentos habilitantes, 5) Publicar el proceso.', source: 'Manual SERCOP', documentType: 'guia' },
    { title: 'Búsqueda de Procesos', content: 'Los usuarios pueden buscar procesos existentes en el módulo de Procesos usando filtros por: código de proceso, tipo de contratación, entidad contratante, estado, rango de fechas y monto referencial. Los resultados se muestran en una tabla ordenable.', source: 'Manual SERCOP', documentType: 'guia' },
    { title: 'Umbrales de Contratación 2024', content: 'Los umbrales vigentes para 2024 son: Ínfima Cuantía hasta $7,263.42, Menor Cuantía bienes/servicios hasta $72,634.22, Cotización hasta $544,756.63, Licitación mayor a $544,756.63. Para obras: Menor Cuantía hasta $254,219.76, Cotización hasta $1,089,513.34.', source: 'Resolución SERCOP', documentType: 'normativa' },
    { title: 'Ferias Inclusivas', content: 'Las Ferias Inclusivas son procedimientos de contratación destinados a privilegiar la participación de actores de la Economía Popular y Solidaria y micro y pequeñas empresas. Se aplican para contrataciones de bienes y servicios de producción nacional.', source: 'LOSNCP Art. 6 num. 10', documentType: 'normativa' },
    { title: 'Pliegos', content: 'Los pliegos son los documentos que contienen las condiciones específicas del proceso de contratación, incluyendo: objeto de la contratación, término de entrega, presupuesto referencial, especificaciones técnicas, metodología de evaluación y modelo de contrato.', source: 'LOSNCP Art. 31', documentType: 'normativa' },
    { title: 'Resolución de Adjudicación', content: 'La máxima autoridad de la entidad contratante o su delegado resolverá la adjudicación del contrato al oferente cuya propuesta represente el mejor costo. La resolución de adjudicación será motivada, se referirá al informe de evaluación y a los criterios de selección.', source: 'LOSNCP Art. 32', documentType: 'normativa' },
    { title: 'Consultoría', content: 'La consultoría será ejercida por personas naturales o jurídicas, nacionales o extranjeras, que cuenten con la experiencia necesaria. Los procedimientos de contratación de consultoría son: contratación directa, lista corta y concurso público, según los montos establecidos.', source: 'LOSNCP Art. 37-40', documentType: 'normativa' },
    { title: 'SOCE Portal de Compras Públicas', content: 'El Sistema Oficial de Contratación del Estado (SOCE) es la plataforma tecnológica del SERCOP que permite gestionar todos los procedimientos de contratación pública de forma electrónica. Incluye módulos para entidades contratantes, proveedores y ciudadanía.', source: 'SERCOP', documentType: 'guia' },
    { title: 'Proveedor Incumplido', content: 'El SERCOP mantendrá un registro de incumplimientos de contratistas y de adjudicatarios fallidos. Un proveedor será declarado adjudicatario fallido si no suscribe el contrato dentro del término previsto. Será declarado contratista incumplido si incumple con las obligaciones contractuales.', source: 'LOSNCP Art. 19', documentType: 'normativa' },
    { title: 'Compras por Emergencia', content: 'En caso de emergencia, la máxima autoridad de la entidad contratante podrá declarar la situación de emergencia y contratar de manera directa. La resolución de emergencia debe ser motivada y publicada en el portal. Se aplica para desastres naturales, situaciones de emergencia sanitaria o de seguridad.', source: 'LOSNCP Art. 57', documentType: 'normativa' },
    { title: 'Orden de Compra', content: 'Las órdenes de compra se generan a través del catálogo electrónico y constituyen los contratos de adquisición de bienes y servicios normalizados. La entidad selecciona productos del catálogo, genera la orden y esta se envía automáticamente al proveedor adjudicado en el convenio marco.', source: 'Manual SERCOP', documentType: 'guia' },
    { title: 'Convalidación de Errores', content: 'La comisión técnica o el delegado podrá solicitar a los oferentes la convalidación de errores de forma que no se altere el contenido sustancial de la oferta, como errores tipográficos, de foliado, sumillas o certificaciones faltantes.', source: 'LOSNCP Art. 23', documentType: 'normativa' },
    { title: 'Preguntas y Respuestas', content: 'Durante el período de preguntas, los proveedores pueden realizar consultas sobre el proceso. La entidad contratante debe responder todas las preguntas dentro del plazo establecido en el cronograma. Las respuestas son publicadas en el portal para conocimiento de todos los participantes.', source: 'Manual SERCOP', documentType: 'guia' },
    { title: 'Acta de Entrega-Recepción', content: 'En todo contrato se procederá a la entrega-recepción parcial o total. En contratos de adquisición de bienes, la entrega-recepción se realizará verificando el cumplimiento de las especificaciones técnicas. Para obras, se verificará el cumplimiento de los diseños y especificaciones técnicas.', source: 'LOSNCP Art. 81', documentType: 'normativa' },
    { title: 'Convenio Marco', content: 'El convenio marco es la modalidad mediante la cual el SERCOP selecciona los proveedores cuyos bienes y servicios serán ofertados en el catálogo electrónico. Los proveedores seleccionados firman un convenio que establece las condiciones de precio, plazo y calidad.', source: 'LOSNCP Art. 43', documentType: 'normativa' },
  ];

  for (const chunk of ragChunks) {
    const existing = await prisma.agentRagChunk.findFirst({
      where: { title: chunk.title, source: chunk.source },
    });
    if (!existing) {
      await prisma.agentRagChunk.create({ data: chunk });
    }
  }
  console.log(`  ✓ ${ragChunks.length} RAG chunks seeded`);

  // ─── Sample Audit Logs ──────────────────────────────────
  const adminUser = await prisma.agentUser.findUnique({ where: { externalId: 'admin-001' } });
  if (adminUser) {
    const existingLogs = await prisma.agentAuditLog.count({ where: { userId: adminUser.id } });
    if (existingLogs === 0) {
      const actions = ['chat', 'data_query', 'tool_call', 'admin_change'];
      for (let i = 0; i < 20; i++) {
        await prisma.agentAuditLog.create({
          data: {
            userId: adminUser.id,
            action: actions[i % actions.length],
            detail: { message: `Sample audit log entry ${i + 1}` },
            ipAddress: '192.168.1.100',
          },
        });
      }
      console.log('  ✓ 20 audit log entries created');
    }
  }

  console.log('✅ Agent SOCE seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
