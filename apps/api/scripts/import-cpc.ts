import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/db.js';

type CpcRow = {
  codigo: string;
  codigoPadre?: string;
  descripcion?: string;
  nivel?: string | number;
  tipo?: string | number;
  id_producto?: string;
  descproducto?: string;
};

type CpcDump = {
  requests?: number;
  visited_codes?: number;
  queue_remaining?: number;
  errors?: unknown[];
  nodes: CpcRow[];
};

function asInt(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

async function main() {
  const jsonPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), '../../research/sercop-cpc-dump/cpc_nodes.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`No existe archivo: ${jsonPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as CpcDump;
  const rows = Array.isArray(dump.nodes) ? dump.nodes : [];
  if (rows.length === 0) throw new Error('El dump no contiene nodos');

  const snapshot = await prisma.cpcSnapshot.create({
    data: {
      source: 'sercop',
      requestsCount: asInt(dump.requests),
      visitedCount: asInt(dump.visited_codes),
      queueRemaining: asInt(dump.queue_remaining),
      errorsCount: Array.isArray(dump.errors) ? dump.errors.length : null,
      status: asInt(dump.queue_remaining) === 0 ? 'completed' : 'partial',
      notes: `import-cpc.ts from ${jsonPath}`,
    },
  });

  const codeSet = new Set<string>();
  for (const r of rows) {
    const code = String(r.codigo || '').trim();
    if (code) codeSet.add(code);
  }

  for (const code of codeSet) {
    const candidates = rows.filter((r) => String(r.codigo || '').trim() === code);
    const best = candidates.sort((a, b) => String(b.descripcion || '').length - String(a.descripcion || '').length)[0];
    const nodeType = asInt(best.tipo);
    await prisma.cpcNode.upsert({
      where: { code },
      update: {
        name: String(best.descripcion || '').trim() || code,
        levelNum: asInt(best.nivel),
        nodeType,
        isLeaf: nodeType === 2,
      },
      create: {
        code,
        name: String(best.descripcion || '').trim() || code,
        levelNum: asInt(best.nivel),
        nodeType,
        isLeaf: nodeType === 2,
      },
    });
  }

  const nodeMap = new Map<string, string>();
  const dbNodes = await prisma.cpcNode.findMany({ where: { code: { in: [...codeSet] } }, select: { id: true, code: true } });
  dbNodes.forEach((n) => nodeMap.set(n.code, n.id));

  const rawBatch = rows.map((r) => {
    const code = String(r.codigo || '').trim();
    const parentCode = String(r.codigoPadre || '').trim() || null;
    return {
      snapshotId: snapshot.id,
      nodeId: nodeMap.get(code) ?? null,
      code,
      parentCode,
      levelNum: asInt(r.nivel),
      nodeType: asInt(r.tipo),
      description: String(r.descripcion || '').trim() || null,
      idProducto: String(r.id_producto || '').trim() || null,
      descProducto: String(r.descproducto || '').trim() || null,
      rawJson: r,
    };
  }).filter((r) => r.code);

  for (let i = 0; i < rawBatch.length; i += 1000) {
    await prisma.cpcNodeRaw.createMany({ data: rawBatch.slice(i, i + 1000) });
  }

  const edgeKeys = new Set<string>();
  const edges: { snapshotId: string; parentNodeId: string | null; childNodeId: string }[] = [];
  for (const r of rows) {
    const childCode = String(r.codigo || '').trim();
    if (!childCode) continue;
    const childNodeId = nodeMap.get(childCode);
    if (!childNodeId) continue;
    const parentCode = String(r.codigoPadre || '').trim();
    const parentNodeId = parentCode ? nodeMap.get(parentCode) ?? null : null;
    const key = `${parentNodeId ?? 'null'}->${childNodeId}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push({ snapshotId: snapshot.id, parentNodeId, childNodeId });
  }

  for (let i = 0; i < edges.length; i += 1000) {
    await prisma.cpcEdge.createMany({ data: edges.slice(i, i + 1000), skipDuplicates: true });
  }

  console.log(JSON.stringify({
    snapshotId: snapshot.id,
    nodesUpserted: codeSet.size,
    rawRows: rawBatch.length,
    edges: edges.length,
    source: jsonPath,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
