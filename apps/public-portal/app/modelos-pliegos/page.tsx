'use client';

import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type Chunk = { id: string; title: string; content?: string; source?: string; documentType?: string };

export default function ModelosPliegosPage() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.rag
      .getChunks({ documentType: 'modelo_pliego', limit: 50 })
      .then((r) => setChunks((r.data || []) as Chunk[]))
      .catch(() => setChunks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicShell activeId="modelos-pliegos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Modelos de pliegos</h1>
        <p className="mb-6 text-text-secondary">
          Documentos tipo y modelos de pliegos para procesos de contratación pública (licitación, contratación directa, catálogo).
        </p>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : chunks.length === 0 ? (
          <Card variant="outline">
            <p className="text-text-secondary">No hay modelos de pliegos publicados en este momento.</p>
          </Card>
        ) : (
          <ul className="space-y-4">
            {chunks.map((c) => (
              <li key={c.id}>
                <Card variant="outline">
                  <h2 className="font-medium text-text-primary">{c.title}</h2>
                  {c.source && <p className="mt-1 text-xs text-text-secondary">Fuente: {c.source}</p>}
                  {c.content && <p className="mt-2 text-sm text-text-secondary line-clamp-3">{c.content}</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PublicShell>
  );
}
