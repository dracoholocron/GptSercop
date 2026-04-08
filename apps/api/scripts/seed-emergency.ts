/**
 * Patch script: Creates an entity with >30% emergency procurement rate
 * so HIGH_EMERGENCY_RATE flag gets triggered.
 */
import { PrismaClient } from '@prisma/client';
import { computeRiskScore } from '../src/modules/analytics/risk-engine.js';
import { generateAlerts } from '../src/modules/analytics/alerts.js';

const prisma = new PrismaClient();

async function main() {
  let entity = await prisma.entity.findFirst({ where: { code: 'EMERG-TEST-001' } });
  if (!entity) {
    entity = await prisma.entity.create({
      data: { code: 'EMERG-TEST-001', name: 'Entidad Emergencias Test' },
    });
  }

  let plan = await prisma.procurementPlan.findFirst({
    where: { entityId: entity.id, year: 2025 },
  });
  if (!plan) {
    plan = await prisma.procurementPlan.create({
      data: {
        entityId: entity.id,
        year: 2025,
        totalAmount: 1_000_000,
        status: 'approved',
      },
    });
  }

  const tenderIds: string[] = [];

  // 4 emergency tenders → 80% emergency rate
  for (let i = 0; i < 4; i++) {
    const existing = await prisma.tender.findFirst({
      where: { code: `EMERG-0${i}` },
    });
    const t = existing ?? (await prisma.tender.create({
      data: {
        procurementPlanId: plan.id,
        code: `EMERG-0${i}`,
        title: `Emergencia Urgente ${i}`,
        processType: 'COTIZACION',
        regime: 'emergencia',
        status: 'awarded',
        estimatedAmount: 50_000,
        publishedAt: new Date('2025-10-01'),
      },
    }));
    tenderIds.push(t.id);
  }

  // 1 regular tender
  const existingReg = await prisma.tender.findFirst({
    where: { code: 'EMERG-REG-01' },
  });
  const regular = existingReg ?? (await prisma.tender.create({
    data: {
      procurementPlanId: plan.id,
      code: 'EMERG-REG-01',
      title: 'Proceso Regular',
      processType: 'COTIZACION',
      status: 'awarded',
      estimatedAmount: 50_000,
      publishedAt: new Date('2025-10-01'),
    },
  }));
  tenderIds.push(regular.id);

  console.log(`Created ${tenderIds.length} tenders for HIGH_EMERGENCY_RATE test`);

  // Compute and check
  const score = await computeRiskScore(tenderIds[0]);
  await generateAlerts(tenderIds[0], score.flags, score.totalScore);
  console.log('Flags:', score.flags);
  console.log('HIGH_EMERGENCY_RATE triggered:', score.flags.includes('HIGH_EMERGENCY_RATE'));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
