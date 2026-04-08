/**
 * compute-all-analytics.ts – Runs full analytics pipeline after seeding.
 *
 * 1. Computes RiskScore for every awarded/active/closed tender
 * 2. Generates alerts from flagged tenders
 * 3. Rebuilds ProviderRelation network
 * 4. Prints summary
 *
 * Usage: npx tsx scripts/compute-all-analytics.ts
 */
import { PrismaClient } from '@prisma/client';
import { computeRiskScore } from '../src/modules/analytics/risk-engine.js';
import { generateAlerts } from '../src/modules/analytics/alerts.js';
import { buildProviderNetwork } from '../src/modules/analytics/provider-network.js';

const prisma = new PrismaClient();

async function main() {
  console.log('=== COMPUTE ALL ANALYTICS ===\n');

  const tenders = await prisma.tender.findMany({
    where: { status: { in: ['awarded', 'active', 'closed'] } },
    select: { id: true, code: true },
    orderBy: { publishedAt: 'desc' },
  });

  console.log(`1. Computing risk scores for ${tenders.length} tenders...`);
  let ok = 0;
  let errors = 0;
  const flagCounts: Record<string, number> = {};
  const levelCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };

  for (const tender of tenders) {
    try {
      const rs = await computeRiskScore(tender.id);
      await generateAlerts(tender.id, rs.flags, rs.totalScore);
      ok++;
      levelCounts[rs.riskLevel]++;
      for (const flag of rs.flags) {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      }
      if (ok % 25 === 0) console.log(`   Processed: ${ok}/${tenders.length}`);
    } catch (e) {
      errors++;
      if (errors <= 5) console.warn(`   Error on ${tender.code}: ${(e as Error).message}`);
    }
  }

  console.log(`   Done: ${ok} ok, ${errors} errors\n`);

  console.log('2. Risk distribution:');
  console.log(`   High:   ${levelCounts.high}`);
  console.log(`   Medium: ${levelCounts.medium}`);
  console.log(`   Low:    ${levelCounts.low}\n`);

  console.log('3. Flag frequency:');
  const sortedFlags = Object.entries(flagCounts).sort((a, b) => b[1] - a[1]);
  for (const [flag, count] of sortedFlags) {
    console.log(`   ${flag}: ${count}`);
  }

  console.log('\n4. Building provider network...');
  const network = await buildProviderNetwork(1);
  console.log(`   Nodes: ${network.nodes.length}, Edges: ${network.edges.length}\n`);

  const alertCount = await prisma.alertEvent.count();
  const unresolvedAlerts = await prisma.alertEvent.count({ where: { resolvedAt: null } });
  console.log('5. Alert summary:');
  console.log(`   Total alerts:    ${alertCount}`);
  console.log(`   Unresolved:      ${unresolvedAlerts}\n`);

  const alertTypes = await prisma.alertEvent.groupBy({
    by: ['alertType'],
    _count: true,
    orderBy: { _count: { alertType: 'desc' } },
  });
  console.log('   By type:');
  for (const at of alertTypes) {
    console.log(`     ${at.alertType}: ${at._count}`);
  }

  console.log('\n=== ANALYTICS COMPUTATION COMPLETE ===');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
