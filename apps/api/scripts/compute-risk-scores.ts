/**
 * Batch job: recalcula RiskScore para todos los procesos adjudicados.
 *
 * Uso: tsx scripts/compute-risk-scores.ts [--dry-run] [--limit N]
 * Cron sugerido: 0 3 * * *  (diario a las 3am UTC)
 */
import { PrismaClient } from '@prisma/client';
import { computeRiskScore } from '../src/modules/analytics/risk-engine.js';
import { generateAlerts } from '../src/modules/analytics/alerts.js';

const prisma = new PrismaClient();

const IS_DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.findIndex((a) => a === '--limit');
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1]) : undefined;

async function main() {
  console.log(`Compute Risk Scores – ${IS_DRY_RUN ? '[DRY RUN] ' : ''}inicio`);

  const tenders = await prisma.tender.findMany({
    where: { status: { in: ['awarded', 'active', 'closed'] } },
    select: { id: true, code: true },
    ...(LIMIT ? { take: LIMIT } : {}),
    orderBy: { publishedAt: 'desc' },
  });

  console.log(`  Procesos a evaluar: ${tenders.length}`);

  let ok = 0;
  let errors = 0;

  for (const tender of tenders) {
    try {
      if (!IS_DRY_RUN) {
        const rs = await computeRiskScore(tender.id);
        await generateAlerts(tender.id, rs.flags, rs.totalScore);
        ok++;
        if (ok % 20 === 0) console.log(`  Procesados: ${ok}/${tenders.length}`);
      } else {
        console.log(`  [dry] ${tender.code}`);
        ok++;
      }
    } catch (e) {
      errors++;
      console.warn(`  Error en ${tender.code}:`, (e as Error).message);
    }
  }

  console.log(`\nCompute Risk Scores OK.`);
  console.log(`  Procesados: ${ok}`);
  console.log(`  Errores:    ${errors}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
