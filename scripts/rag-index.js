#!/usr/bin/env node
/**
 * Crea índice GIN para búsqueda full-text en RagChunk (opcional, mejora rendimiento).
 * Requiere DATABASE_URL. Ejecutar: node scripts/rag-index.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunk_fts_idx
    ON "RagChunk"
    USING GIN(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'')))
  `);
  console.log('Índice RAG GIN creado');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
