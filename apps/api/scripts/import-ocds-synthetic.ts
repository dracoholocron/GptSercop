/**
 * Importador combinado: OCDS (datos reales Ecuador) + Faker (sintéticos)
 * Objetivo: al menos 100 registros de cada tipo para pruebas del módulo IA
 *
 * Uso: npm run crawler:import (desde raíz) o tsx scripts/import-ocds-synthetic.ts (desde apps/api)
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

const OCDS_BASE = process.env.CRAWLER_OCDS_URL || 'https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api';
const TARGET_COUNT = 100;
const DELAY_MS = 500; // Evitar rate limiting

const PROVINCIAS_EC = ['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Tungurahua', 'Imbabura', 'Loja', 'El Oro', 'Chimborazo', 'Cotopaxi'];
const CANTONES: Record<string, string[]> = {
  Pichincha: ['Quito', 'Cayambe', 'Rumiñahui', 'Mejía'],
  Guayas: ['Guayaquil', 'Daule', 'Samborondón', 'Durán'],
  Azuay: ['Cuenca', 'Girón', 'Paute'],
  Manabí: ['Portoviejo', 'Manta', 'Chone'],
};

type OcdsSearchItem = {
  ocid?: string;
  buyerId?: string;
  buyerName?: string;
  title?: string;
  description?: string;
  internal_type?: string;
  supplierName?: string;
  supplierId?: string;
  amount?: number;
  [key: string]: unknown;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOcdsSearch(year: number, search: string, page: number): Promise<{ data?: OcdsSearchItem[]; total?: number; pages?: number }> {
  const url = `${OCDS_BASE}/search_ocds?year=${year}&search=${encodeURIComponent(search)}&page=${page}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return {};
    const json = await res.json();
    return {
      data: json.data || json.results || json.releases || [],
      total: json.total ?? json.count,
      pages: json.pages ?? 1,
    };
  } catch (e) {
    console.warn(`  OCDS fetch error (${search} p${page}):`, (e as Error).message);
    return {};
  }
}

async function importFromOcds(): Promise<{
  entities: Map<string, string>;
  providers: Map<string, string>;
  tendersCreated: number;
  bidsCreated: number;
  contractsCreated: number;
}> {
  const entityByKey = new Map<string, string>();
  const providerByKey = new Map<string, string>();
  const ocidsSeen = new Set<string>();
  let entityCounter = 0;
  let providerCounter = 0;
  let tendersCreated = 0;
  let bidsCreated = 0;
  let contractsCreated = 0;

  const searches = ['compras', 'servicios', 'equipos', 'suministros', 'obras', 'construcción', 'mantenimiento', 'consultoría'];
  const years = [2024, 2023, 2022];

  for (const search of searches) {
    for (const year of years) {
      for (let page = 1; page <= 5; page++) {
        const { data } = await fetchOcdsSearch(year, search, page);
        if (!data?.length) break;

        for (const item of data as OcdsSearchItem[]) {
          const ocid = item.ocid || item.id || JSON.stringify(item).slice(0, 50);
          if (ocidsSeen.has(ocid)) continue;
          ocidsSeen.add(ocid);

          const buyerName = (item.buyerName || item.buyer?.name || item.comprador || '')?.toString().trim();
          const supplierName = (item.supplierName || item.supplier?.name || item.proveedor || item.adjudicatario || '')?.toString().trim();
          const title = (item.title || item.titulo || item.description || 'Proceso de contratación')?.toString().trim().slice(0, 500);
          const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.value || item.monto || item.amount || 0)) || 10000;

          if (!title) continue;

          let entityId: string | undefined;
          if (buyerName) {
            const key = buyerName.toLowerCase().slice(0, 100);
            if (!entityByKey.has(key)) {
              entityCounter++;
              const code = `OCDS-B-${entityCounter}`;
              const existing = await prisma.entity.findFirst({ where: { code } });
              const entity = existing ?? await prisma.entity.create({
                data: {
                  name: buyerName.slice(0, 255),
                  code,
                  legalName: buyerName,
                  organizationType: 'entidad',
                },
              });
              entityByKey.set(key, entity.id);
            }
            entityId = entityByKey.get(key);
          }

          if (!entityId) {
            const code = `OCDS-GEN-${year}-${ocidsSeen.size}`;
            const existing = await prisma.entity.findFirst({ where: { code } });
            const entity = existing ?? await prisma.entity.create({
              data: {
                name: `Entidad ${year}-${ocidsSeen.size}`,
                code,
                organizationType: 'entidad',
              },
            });
            entityId = entity.id;
          }

          let plan = await prisma.procurementPlan.findFirst({
            where: { entityId, year },
          });
          if (!plan) {
            plan = await prisma.procurementPlan.create({
              data: {
                entityId,
                year,
                status: 'published',
                publishedAt: new Date(),
                totalAmount: amount * 10,
              },
            });
          }

          const tenderCode = `OCDS-T-${ocidsSeen.size}`;
          const existingTender = await prisma.tender.findFirst({
            where: { code: tenderCode },
          });
          if (existingTender) continue;

          const tender = await prisma.tender.create({
            data: {
              procurementPlanId: plan.id,
              code: tenderCode,
              title: title || `Proceso ${ocid}`,
              description: (item.description as string)?.slice(0, 2000) || null,
              status: 'published',
              procurementMethod: 'open',
              estimatedAmount: amount,
              publishedAt: new Date(year, 0, 1),
            },
          });
          tendersCreated++;

          let providerId: string | undefined;
          if (supplierName) {
            const pKey = supplierName.toLowerCase().slice(0, 100);
            if (!providerByKey.has(pKey)) {
              providerCounter++;
              const prov = await prisma.provider.create({
                data: {
                  name: supplierName.slice(0, 255),
                  identifier: (item.supplierId || item.ruc || `OCDS-P-${providerCounter}`)?.toString().slice(0, 20),
                  legalName: supplierName,
                  province: PROVINCIAS_EC[providerCounter % PROVINCIAS_EC.length],
                  canton: 'N/A',
                },
              });
              providerByKey.set(pKey, prov.id);
            }
            providerId = providerByKey.get(pKey);
          }

          if (providerId) {
            const bid = await prisma.bid.create({
              data: {
                tenderId: tender.id,
                providerId,
                amount: amount * (0.9 + Math.random() * 0.2),
                status: 'submitted',
                submittedAt: new Date(year, 1, 1),
              },
            });
            bidsCreated++;

            if (Math.random() > 0.5) {
              await prisma.contract.create({
                data: {
                  tenderId: tender.id,
                  providerId,
                  contractNo: `CON-${year}-${contractsCreated.toString().padStart(4, '0')}`,
                  status: 'signed',
                  amount: bid.amount,
                  signedAt: new Date(year, 2, 1),
                },
              }).catch(() => {});
              contractsCreated++;
            }
          }
        }
        await sleep(DELAY_MS);
      }
    }
  }

  return { tendersCreated, bidsCreated, contractsCreated };
}

async function generateSynthetic(
  currentCounts: { entities: number; providers: number; tenders: number; bids: number; contracts: number }
) {
  faker.seed(42);

  const entityIds: string[] = [];
  const providerIds: string[] = [];
  const tenderIds: string[] = [];

  const toCreate = {
    entities: Math.max(0, TARGET_COUNT - currentCounts.entities),
    providers: Math.max(0, TARGET_COUNT - currentCounts.providers),
    tenders: Math.max(0, TARGET_COUNT - currentCounts.tenders),
    bids: Math.max(0, TARGET_COUNT - currentCounts.bids),
    contracts: Math.max(0, TARGET_COUNT - currentCounts.contracts),
  };

  const orgTypes = ['ministerio', 'gad', 'institucion', 'empresa_publica', 'otro'];

  for (let i = 0; i < toCreate.entities; i++) {
    const name = faker.helpers.arrayElement([
      `Ministerio de ${faker.commerce.department()}`,
      `GAD ${faker.location.city()}`,
      `Instituto de ${faker.commerce.productAdjective()}`,
      faker.company.name() + ' Pública',
    ]);
    const entity = await prisma.entity.create({
      data: {
        name,
        code: `SYN-ENT-${Date.now()}-${i}`,
        legalName: name,
        organizationType: orgTypes[i % orgTypes.length],
      },
    });
    entityIds.push(entity.id);
  }

  for (let i = 0; i < toCreate.providers; i++) {
    const province = PROVINCIAS_EC[i % PROVINCIAS_EC.length];
    const cantones = CANTONES[province] || ['Principal'];
    const provider = await prisma.provider.create({
      data: {
        name: faker.company.name(),
        identifier: `17${String(9123456700 + i + Math.floor(Date.now() / 1000) % 100000).padStart(9, '0')}001`,
        legalName: faker.company.name() + ' S.A.',
        tradeName: faker.company.buzzNoun(),
        province,
        canton: cantones[i % cantones.length],
        address: faker.location.streetAddress(),
      },
    });
    providerIds.push(provider.id);
  }

  const allEntities = entityIds.length
    ? entityIds
    : (await prisma.entity.findMany({ take: 200 })).map((e) => e.id);
  const allProviders = providerIds.length
    ? providerIds
    : (await prisma.provider.findMany({ take: 200 })).map((p) => p.id);

  const year = new Date().getFullYear();
  for (let i = 0; i < toCreate.tenders; i++) {
    const entityId = allEntities[i % allEntities.length];
    let plan = await prisma.procurementPlan.findFirst({
      where: { entityId, year },
    });
    if (!plan) {
      plan = await prisma.procurementPlan.create({
        data: {
          entityId,
          year,
          status: 'published',
          publishedAt: new Date(),
          totalAmount: faker.number.float({ min: 50000, max: 500000, fractionDigits: 2 }),
        },
      });
    }

    const titles = [
      'Adquisición de equipos de cómputo',
      'Servicios de limpieza y aseo',
      'Suministro de material de oficina',
      'Mantenimiento de infraestructura',
      'Obra de construcción menor',
      'Consultoría especializada',
      'Compra de insumos médicos',
      'Servicios de seguridad',
    ];
    const tender = await prisma.tender.create({
      data: {
        procurementPlanId: plan.id,
        title: faker.helpers.arrayElement(titles) + ` - ${faker.lorem.words(3)}`,
        description: faker.lorem.paragraph(),
        status: 'published',
        procurementMethod: faker.helpers.arrayElement(['open', 'direct', 'catalog']),
        estimatedAmount: faker.number.float({ min: 5000, max: 150000, fractionDigits: 2 }),
        publishedAt: faker.date.past({ years: 1 }),
      },
    });
    tenderIds.push(tender.id);
  }

  const tendersForBids = tenderIds.length
    ? tenderIds
    : (await prisma.tender.findMany({ where: { status: 'published' }, take: 300 })).map((t) => t.id);

  for (let i = 0; i < toCreate.bids; i++) {
    const tenderId = tendersForBids[i % tendersForBids.length];
    const providerId = allProviders[i % allProviders.length];
    const existing = await prisma.bid.findFirst({
      where: { tenderId, providerId },
    });
    if (!existing) {
      await prisma.bid.create({
        data: {
          tenderId,
          providerId,
          amount: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
          status: 'submitted',
          submittedAt: faker.date.past({ years: 1 }),
        },
      });
    }
  }

  const tendersForContracts = await prisma.tender.findMany({
    where: { status: 'published' },
    include: { bids: true, contract: true },
    take: 500,
  });
  let contractsAdded = 0;
  for (const tender of tendersForContracts) {
    if (contractsAdded >= toCreate.contracts) break;
    if (tender.contract) continue;
    let bid = tender.bids[0];
    if (!bid) {
      const providerId = allProviders[contractsAdded % allProviders.length];
      bid = await prisma.bid.create({
        data: {
          tenderId: tender.id,
          providerId,
          amount: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
          status: 'submitted',
          submittedAt: faker.date.past({ years: 1 }),
        },
      });
    }
    await prisma.contract.create({
      data: {
        tenderId: tender.id,
        providerId: bid.providerId,
        contractNo: `CON-SYN-${Date.now()}-${String(contractsAdded).padStart(4, '0')}`,
        status: 'signed',
        amount: bid.amount,
        signedAt: faker.date.past({ years: 1 }),
      },
    });
    contractsAdded++;
  }
}

async function main() {
  console.log('Importador OCDS + Sintéticos – objetivo: 100 registros por tipo\n');

  const before = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('Estado actual:', before);

  console.log('\n1. Importando desde OCDS Ecuador...');
  let ocdsResult;
  try {
    ocdsResult = await importFromOcds();
    console.log(`   OCDS: ${ocdsResult.tendersCreated} tenders, ${ocdsResult.bidsCreated} bids, ${ocdsResult.contractsCreated} contracts`);
  } catch (e) {
    console.warn('   OCDS no disponible:', (e as Error).message);
    ocdsResult = { entities: new Map(), providers: new Map(), tendersCreated: 0, bidsCreated: 0, contractsCreated: 0 };
  }

  const afterOcds = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('   Después de OCDS:', afterOcds);

  console.log('\n2. Completando con datos sintéticos (Faker)...');
  await generateSynthetic(afterOcds);

  const after = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('\nEstado final:', after);
  console.log('\nImportación OK. Datos listos para pruebas del módulo IA.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
