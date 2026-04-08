type PrismaLike = {
  agentAuditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  agentInteraction: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };
};

export interface InteractionData {
  sessionId: string;
  userId: string;
  messageRole: string;
  content: string;
  toolCalls?: unknown;
  ragChunksUsed?: string[];
  dataSourceUsed?: string;
  sqlGenerated?: string;
  llmProvider?: string;
  llmModel?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  screenContext?: string;
}

export async function logAudit(
  prisma: PrismaLike,
  userId: string,
  action: string,
  detail: Record<string, unknown>,
  ipAddress?: string,
): Promise<void> {
  await prisma.agentAuditLog.create({
    data: { userId, action, detail, ipAddress },
  });
}

export async function logInteraction(
  prisma: PrismaLike,
  data: InteractionData,
): Promise<string> {
  const record = await prisma.agentInteraction.create({ data });
  return record.id;
}

export async function updateFeedback(
  prisma: PrismaLike,
  interactionId: string,
  rating: number,
  text?: string,
): Promise<void> {
  await prisma.agentInteraction.update({
    where: { id: interactionId },
    data: {
      feedbackRating: rating,
      ...(text ? { feedbackText: text } : {}),
    },
  });
}

export async function getInteractionStats(
  prisma: PrismaLike,
  from?: Date,
  to?: Date,
): Promise<{
  totalMessages: number;
  avgLatencyMs: number;
  avgRating: number;
}> {
  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = from;
    if (to) (where.createdAt as Record<string, unknown>).lte = to;
  }

  const total = await prisma.agentInteraction.count({ where });

  const interactions = await prisma.agentInteraction.findMany({
    where,
    select: { latencyMs: true, feedbackRating: true },
  }) as Array<{ latencyMs?: number | null; feedbackRating?: number | null }>;

  const latencies = interactions
    .map((i) => i.latencyMs)
    .filter((l): l is number => l != null);
  const ratings = interactions
    .map((i) => i.feedbackRating)
    .filter((r): r is number => r != null);

  return {
    totalMessages: total,
    avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
  };
}
