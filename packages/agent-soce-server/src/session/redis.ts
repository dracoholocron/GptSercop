import Redis from 'ioredis';

const SESSION_PREFIX = 'agent-soce:session:';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

export async function closeRedis(): Promise<void> {
  await redis.quit();
}

export async function setSession(
  id: string,
  data: Record<string, unknown>,
  ttl: number,
): Promise<void> {
  const key = `${SESSION_PREFIX}${id}`;
  await redis.setex(key, ttl, JSON.stringify(data));
}

export async function getSession(id: string): Promise<Record<string, unknown> | null> {
  const key = `${SESSION_PREFIX}${id}`;
  const raw = await redis.get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  const key = `${SESSION_PREFIX}${id}`;
  await redis.del(key);
}
