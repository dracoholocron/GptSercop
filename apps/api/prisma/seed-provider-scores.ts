/**
 * seed-provider-scores.ts
 *
 * Creates 20 diverse providers and their ProviderScore records to showcase
 * the full range of Reputación de Proveedores functionality.
 *
 * Run: npm run seed:provider-scores --workspace=api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProviderDef {
  identifier: string;
  name: string;
  province: string;
  compliance: number;
  delivery: number;
  price: number;
  diversity: number;
}

const PROVIDERS: ProviderDef[] = [
  // ── PREMIUM (total >= 80) ──────────────────────────────────────────────────
  {
    identifier: '1791234567001',
    name: 'Tecnología Ecuador S.A.',
    province: 'Pichincha',
    compliance: 100,
    delivery: 95,
    price: 88,
    diversity: 100,
  },
  {
    identifier: '1792345678001',
    name: 'Construmax Cía. Ltda.',
    province: 'Guayas',
    compliance: 95,
    delivery: 90,
    price: 82,
    diversity: 80,
  },
  {
    identifier: '1793456789001',
    name: 'MedSupply Ecuador S.A.',
    province: 'Pichincha',
    compliance: 90,
    delivery: 88,
    price: 85,
    diversity: 100,
  },
  {
    identifier: '1794567890001',
    name: 'InfraTech del Sur Cía. Ltda.',
    province: 'Azuay',
    compliance: 92,
    delivery: 85,
    price: 90,
    diversity: 80,
  },
  {
    identifier: '1795678901001',
    name: 'Servicios Integrales Norte S.A.',
    province: 'Imbabura',
    compliance: 88,
    delivery: 92,
    price: 80,
    diversity: 100,
  },

  // ── STANDARD (50 <= total < 80) ────────────────────────────────────────────
  {
    identifier: '1796789012001',
    name: 'Distribuidora Central del Ecuador',
    province: 'Pichincha',
    compliance: 80,
    delivery: 70,
    price: 65,
    diversity: 60,
  },
  {
    identifier: '1797890123001',
    name: 'Oficina Pública Suministros Cía.',
    province: 'Guayas',
    compliance: 70,
    delivery: 65,
    price: 75,
    diversity: 60,
  },
  {
    identifier: '1798901234001',
    name: 'Logística Andina S.A.',
    province: 'Tungurahua',
    compliance: 75,
    delivery: 60,
    price: 70,
    diversity: 60,
  },
  {
    identifier: '1799012345001',
    name: 'Grupo Constructor Amazonas',
    province: 'Napo',
    compliance: 65,
    delivery: 70,
    price: 68,
    diversity: 40,
  },
  {
    identifier: '1700123456001',
    name: 'TelecomSol Ecuador S.A.',
    province: 'Pichincha',
    compliance: 72,
    delivery: 68,
    price: 55,
    diversity: 60,
  },
  {
    identifier: '1701234567001',
    name: 'Energía Renovable del Pacífico',
    province: 'Manabí',
    compliance: 68,
    delivery: 74,
    price: 62,
    diversity: 40,
  },
  {
    identifier: '1702345678001',
    name: 'Consultora Gestión Pública Ltda.',
    province: 'Pichincha',
    compliance: 60,
    delivery: 58,
    price: 72,
    diversity: 60,
  },

  // ── WATCH (30 <= total < 50) ───────────────────────────────────────────────
  {
    identifier: '1703456789001',
    name: 'Construcciones Básicas del Sur',
    province: 'Loja',
    compliance: 50,
    delivery: 45,
    price: 40,
    diversity: 40,
  },
  {
    identifier: '1704567890001',
    name: 'Materiales y Suministros Cía.',
    province: 'El Oro',
    compliance: 40,
    delivery: 50,
    price: 35,
    diversity: 40,
  },
  {
    identifier: '1705678901001',
    name: 'Servicios Menores Quito Ltda.',
    province: 'Pichincha',
    compliance: 45,
    delivery: 40,
    price: 42,
    diversity: 20,
  },
  {
    identifier: '1706789012001',
    name: 'Proveedor Regional Chimborazo',
    province: 'Chimborazo',
    compliance: 48,
    delivery: 35,
    price: 38,
    diversity: 20,
  },

  // ── RESTRICTED (total < 30) ────────────────────────────────────────────────
  {
    identifier: '1707890123001',
    name: 'Obras Fallidas del Norte S.A.',
    province: 'Esmeraldas',
    compliance: 10,
    delivery: 20,
    price: 30,
    diversity: 20,
  },
  {
    identifier: '1708901234001',
    name: 'Incumplimientos Generales Cía.',
    province: 'Guayas',
    compliance: 5,
    delivery: 15,
    price: 25,
    diversity: 0,
  },
  {
    identifier: '1709012345001',
    name: 'Proveedor con Multas Activas',
    province: 'Los Ríos',
    compliance: 0,
    delivery: 10,
    price: 20,
    diversity: 20,
  },
  {
    identifier: '1700987654001',
    name: 'Contratos Rescindidos S.A.',
    province: 'Sucumbíos',
    compliance: 15,
    delivery: 8,
    price: 22,
    diversity: 0,
  },
];

function calcTotal(p: ProviderDef): number {
  return Math.round(p.compliance * 0.3 + p.delivery * 0.25 + p.price * 0.25 + p.diversity * 0.2);
}

function tier(score: number): string {
  if (score >= 80) return 'premium';
  if (score >= 50) return 'standard';
  if (score >= 30) return 'watch';
  return 'restricted';
}

async function main() {
  console.log('=== SEED PROVIDER SCORES (20 cases) ===\n');

  for (const def of PROVIDERS) {
    let provider = await prisma.provider.findFirst({ where: { identifier: def.identifier } });
    if (provider) {
      provider = await prisma.provider.update({
        where: { id: provider.id },
        data: { name: def.name, province: def.province },
      });
    } else {
      provider = await prisma.provider.create({
        data: {
          identifier: def.identifier,
          name: def.name,
          legalName: def.name,
          tradeName: def.name.split(' ')[0],
          status: 'active',
          province: def.province,
          canton: 'Capital',
        },
      });
    }

    const total = calcTotal(def);
    const t = tier(total);

    await prisma.providerScore.upsert({
      where: { providerId: provider.id },
      update: {
        complianceScore: def.compliance,
        deliveryScore: def.delivery,
        priceScore: def.price,
        diversityScore: def.diversity,
        totalScore: total,
        tier: t,
        calculatedAt: new Date(),
      },
      create: {
        providerId: provider.id,
        complianceScore: def.compliance,
        deliveryScore: def.delivery,
        priceScore: def.price,
        diversityScore: def.diversity,
        totalScore: total,
        tier: t,
        calculatedAt: new Date(),
      },
    });

    console.log(
      `  [${t.toUpperCase().padEnd(10)}] ${def.name.padEnd(44)} total=${total}  (C:${def.compliance} D:${def.delivery} P:${def.price} Div:${def.diversity})`,
    );
  }

  const counts = { premium: 0, standard: 0, watch: 0, restricted: 0 };
  for (const p of PROVIDERS) {
    const t = tier(calcTotal(p)) as keyof typeof counts;
    counts[t]++;
  }

  console.log(`\n=== DONE ===`);
  console.log(
    `  premium=${counts.premium}  standard=${counts.standard}  watch=${counts.watch}  restricted=${counts.restricted}`,
  );
  console.log(`  Total: ${PROVIDERS.length} provider score records seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
