/**
 * Fase 4: Observabilidad – comprobación de Redis para /health.
 */
import { createClient } from 'redis';

const url = process.env.REDIS_URL;

export function isRedisConfigured(): boolean {
  return !!url;
}

export async function pingRedis(): Promise<'connected' | 'disconnected'> {
  if (!url) return 'disconnected';
  const client = createClient({ url });
  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return 'connected';
  } catch {
    try {
      await client.quit();
    } catch (_) {}
    return 'disconnected';
  }
}
