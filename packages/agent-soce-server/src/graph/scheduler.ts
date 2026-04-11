import { prisma } from '../db/client.js';
import { syncGraphFromBids } from './sync-worker.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

function parseCronToMs(cron: string): number {
  const match = cron.match(/^\d+\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (match) return parseInt(match[1], 10) * 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

export async function startGraphScheduler(): Promise<void> {
  const config = await prisma.agentGraphConfig.findFirst();
  if (!config?.syncEnabled) {
    console.log('[graph-scheduler] Sync disabled, skipping scheduler start');
    return;
  }

  const intervalMs = parseCronToMs(config.syncCron);
  console.log(
    `[graph-scheduler] Starting sync every ${intervalMs / 3600000}h for graph "${config.graphName}"`,
  );

  intervalId = setInterval(async () => {
    try {
      console.log('[graph-scheduler] Starting scheduled sync...');
      const result = await syncGraphFromBids(config.graphName);
      console.log(
        `[graph-scheduler] Sync complete: ${result.synced} edges, ${result.communities} communities in ${result.duration}ms`,
      );
    } catch (err) {
      console.error('[graph-scheduler] Sync failed:', err instanceof Error ? err.message : err);
    }
  }, intervalMs);
}

export function stopGraphScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function triggerSync(): Promise<{ status: string; result?: unknown; error?: string }> {
  const config = await prisma.agentGraphConfig.findFirst();
  const graphName = config?.graphName ?? 'sercop_graph';
  try {
    const result = await syncGraphFromBids(graphName);
    return { status: 'completed', result };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}
