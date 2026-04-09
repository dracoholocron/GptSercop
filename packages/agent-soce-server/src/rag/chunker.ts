export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface TextChunk {
  index: number;
  text: string;
}

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 64;

/**
 * Split text into overlapping chunks suitable for embedding.
 *
 * Strategy:
 *  1. Split on double-newlines (paragraphs).
 *  2. Merge short paragraphs until reaching chunkSize.
 *  3. When a chunk is full, start the next one with an overlap window
 *     taken from the tail of the previous chunk.
 */
export function chunkText(
  text: string,
  opts?: Partial<ChunkOptions>,
): TextChunk[] {
  const chunkSize = opts?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(opts?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP, chunkSize - 1);

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const flat = paragraphs.join('\n\n');
  if (flat.length <= chunkSize) {
    return [{ index: 0, text: flat }];
  }

  const chunks: TextChunk[] = [];
  let pos = 0;

  while (pos < flat.length) {
    const end = Math.min(pos + chunkSize, flat.length);
    let slice = flat.slice(pos, end);

    // Try to break at a sentence or paragraph boundary
    if (end < flat.length) {
      const lastBreak = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
      );
      if (lastBreak > chunkSize * 0.3) {
        slice = slice.slice(0, lastBreak + 1);
      }
    }

    chunks.push({ index: chunks.length, text: slice.trim() });

    const advance = Math.max(slice.length - overlap, 1);
    pos += advance;
  }

  return chunks;
}
