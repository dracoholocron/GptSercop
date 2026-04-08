type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

function assertSafeGraphName(name: string): void {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid graph name: ${name}`);
  }
}

export async function ensureGraphExists(prisma: PrismaLike, graphName: string): Promise<void> {
  assertSafeGraphName(graphName);
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS age`);
  await prisma.$executeRawUnsafe(`SET search_path = ag_catalog, "$user", public`);
  try {
    await prisma.$queryRawUnsafe(`SELECT create_graph('${graphName}')`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists')) throw err;
  }
}

export async function cypherQuery<T = unknown>(
  prisma: PrismaLike,
  graphName: string,
  cypher: string,
): Promise<T[]> {
  assertSafeGraphName(graphName);
  await prisma.$executeRawUnsafe(`SET search_path = ag_catalog, "$user", public`);

  const sql = `SELECT * FROM cypher('${graphName}', $$ ${cypher} $$) AS (result agtype)`;
  const rows = await prisma.$queryRawUnsafe<Array<{ result: string }>>(sql);

  return rows.map((r) => {
    try {
      return JSON.parse(r.result) as T;
    } catch {
      return r.result as unknown as T;
    }
  });
}
