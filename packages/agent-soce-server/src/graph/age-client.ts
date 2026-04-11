type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

export function assertSafeGraphName(name: string): void {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid graph name: ${name}`);
  }
}

function parseAgtypeCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
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
  resultColumns: readonly string[] = ['result'],
): Promise<T[]> {
  assertSafeGraphName(graphName);
  await prisma.$executeRawUnsafe(`SET search_path = ag_catalog, "$user", public`);

  const asClause = resultColumns.map((c) => `"${c.replace(/"/g, '')}" agtype`).join(', ');
  const sql = `SELECT * FROM cypher('${graphName}', $$ ${cypher} $$) AS (${asClause})`;
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql);

  return rows.map((r) => {
    if (resultColumns.length === 1) {
      const key = resultColumns[0];
      const cell = r[key];
      return parseAgtypeCell(cell) as T;
    }
    const obj: Record<string, unknown> = {};
    for (const col of resultColumns) {
      obj[col] = parseAgtypeCell(r[col]);
    }
    return obj as T;
  });
}
