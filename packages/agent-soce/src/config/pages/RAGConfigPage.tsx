import * as React from 'react';

export interface RAGConfigPageProps {
  baseUrl: string;
  token: string;
}

type SearchWeight = { semantic: number; keyword: number };

type RAGResponse = {
  id?: string;
  embeddingProviderId?: string | null;
  embeddingModel?: string;
  embeddingDims?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  searchWeight?: SearchWeight | string;
  rerankerEnabled?: boolean;
  createdAt?: string;
  totalChunks?: number;
  indexedDocuments?: number;
  lastIndexedAt?: string;
  stats?: { totalChunks?: number; indexedDocuments?: number; lastIndexedAt?: string };
};

interface ProviderOption {
  id: string;
  name: string;
  type: string;
  model: string;
}

const KNOWN_DIMS: Record<string, number> = {
  'nomic-embed-text': 768,
  'mxbai-embed-large': 1024,
  'all-minilm': 384,
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-004': 768,
};

const PROVIDER_EMBED_MODELS: Record<string, string> = {
  ollama: 'nomic-embed-text',
  openai: 'text-embedding-3-small',
  google: 'text-embedding-004',
  anthropic: 'text-embedding-3-small',
};

const shell: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  color: '#0f172a',
  maxWidth: 720,
  margin: '0 auto',
  padding: 24,
};

const title: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: '0 0 20px' };

const card: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 20,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  marginBottom: 20,
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #059669, #0d9488)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff1f2',
  color: '#b91c1c',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: 14,
  marginBottom: 16,
};

const statGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const statCard: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
};

function joinUrl(root: string, path: string): string {
  const r = root.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${r}${p}`;
}

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function parseSearchWeight(raw: RAGResponse['searchWeight']): SearchWeight {
  if (raw && typeof raw === 'object' && 'semantic' in raw && 'keyword' in raw) {
    return { semantic: Number(raw.semantic), keyword: Number(raw.keyword) };
  }
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw) as SearchWeight;
      if (typeof j.semantic === 'number' && typeof j.keyword === 'number') return j;
    } catch {
      /* ignore */
    }
  }
  return { semantic: 0.6, keyword: 0.4 };
}

export function RAGConfigPage({ baseUrl, token }: RAGConfigPageProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [reindexing, setReindexing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [raw, setRaw] = React.useState<RAGResponse | null>(null);

  const [embeddingProviderId, setEmbeddingProviderId] = React.useState<string | null>(null);
  const [embeddingModel, setEmbeddingModel] = React.useState('');
  const [embeddingDims, setEmbeddingDims] = React.useState(768);
  const [chunkSize, setChunkSize] = React.useState(512);
  const [chunkOverlap, setChunkOverlap] = React.useState(64);
  const [semantic, setSemantic] = React.useState(0.6);
  const [keyword, setKeyword] = React.useState(0.4);
  const [rerankerEnabled, setRerankerEnabled] = React.useState(false);

  const [providers, setProviders] = React.useState<ProviderOption[]>([]);
  const [originalProviderId, setOriginalProviderId] = React.useState<string | null>(null);
  const [originalModel, setOriginalModel] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ragRes, provRes] = await Promise.all([
        fetch(joinUrl(baseUrl, '/config/rag'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(joinUrl(baseUrl, '/providers')).catch(() => null),
      ]);
      if (!ragRes.ok) throw new Error(await ragRes.text().catch(() => ragRes.statusText));
      const data = (await ragRes.json()) as RAGResponse;
      setRaw(data);
      setEmbeddingProviderId(data.embeddingProviderId ?? null);
      setOriginalProviderId(data.embeddingProviderId ?? null);
      setEmbeddingModel(data.embeddingModel ?? '');
      setOriginalModel(data.embeddingModel ?? '');
      setEmbeddingDims(data.embeddingDims ?? 768);
      setChunkSize(data.chunkSize ?? 512);
      setChunkOverlap(data.chunkOverlap ?? 64);
      const sw = parseSearchWeight(data.searchWeight);
      setSemantic(sw.semantic);
      setKeyword(sw.keyword);
      setRerankerEnabled(Boolean(data.rerankerEnabled));

      if (provRes?.ok) {
        const prov = (await provRes.json()) as ProviderOption[];
        setProviders(Array.isArray(prov) ? prov : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load RAG config');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function setSemanticWeight(v: number): void {
    const s = Math.min(1, Math.max(0, v));
    setSemantic(s);
    setKeyword(Number((1 - s).toFixed(2)));
  }

  function setKeywordWeight(v: number): void {
    const k = Math.min(1, Math.max(0, v));
    setKeyword(k);
    setSemantic(Number((1 - k).toFixed(2)));
  }

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const body = {
        embeddingProviderId: embeddingProviderId || null,
        embeddingModel: embeddingModel.trim(),
        embeddingDims,
        chunkSize,
        chunkOverlap,
        searchWeight: { semantic, keyword },
        rerankerEnabled,
      };
      const res = await fetch(joinUrl(baseUrl, '/config/rag'), {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const result = (await res.json()) as { reindexRequired?: boolean };
      if (result.reindexRequired) {
        setInfo('RAG settings saved. All existing embeddings have been invalidated — please run "Reindex all" to regenerate them with the new model.');
      } else {
        setInfo('RAG settings saved.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function reindexAll(): Promise<void> {
    setReindexing(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/rag/reindex'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; status?: string };
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      setInfo(data.message ?? data.status ?? 'Reindex requested.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reindex failed');
    } finally {
      setReindexing(false);
    }
  }

  const stats = raw?.stats;
  const totalChunks = raw?.totalChunks ?? stats?.totalChunks;
  const indexedDocuments = raw?.indexedDocuments ?? stats?.indexedDocuments;
  const lastIndexedAt = raw?.lastIndexedAt ?? stats?.lastIndexedAt;

  return (
    <div style={shell}>
      <h1 style={title}>RAG configuration</h1>
      {error ? <div style={errorBox}>{error}</div> : null}
      {info ? (
        <div style={{ ...errorBox, background: '#ecfdf5', color: '#047857', marginBottom: 16 }}>{info}</div>
      ) : null}

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Index stats</h2>
        <div style={statGrid}>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Total chunks</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{totalChunks != null ? totalChunks : '—'}</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Indexed documents</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{indexedDocuments != null ? indexedDocuments : '—'}</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Last indexed</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{lastIndexedAt ?? '—'}</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 0 }}>
          Stats appear when the API includes them on <code>/config/rag</code>.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={card}>
          {(embeddingProviderId !== originalProviderId || embeddingModel !== originalModel) && (
            <div style={{ padding: 12, borderRadius: 10, background: '#fefce8', color: '#854d0e', fontSize: 13, marginBottom: 16, border: '1px solid #fde68a' }}>
              <strong>Advertencia:</strong> Cambiar el proveedor o modelo de embedding invalidará todos los vectores existentes. Se requiere un re-index completo después de guardar.
            </div>
          )}
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={label} htmlFor="rag-embed-provider">
                Embedding provider
              </label>
              <select
                id="rag-embed-provider"
                style={input}
                value={embeddingProviderId ?? ''}
                onChange={(e) => {
                  const newId = e.target.value || null;
                  setEmbeddingProviderId(newId);
                  if (newId) {
                    const prov = providers.find((p) => p.id === newId);
                    if (prov) {
                      const defaultModel = PROVIDER_EMBED_MODELS[prov.type] ?? prov.model;
                      setEmbeddingModel(defaultModel);
                      const dims = KNOWN_DIMS[defaultModel];
                      if (dims) setEmbeddingDims(dims);
                    }
                  } else {
                    setEmbeddingModel('nomic-embed-text');
                    setEmbeddingDims(768);
                  }
                }}
              >
                <option value="">(Default: Ollama local)</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label} htmlFor="rag-embed-model">
                Embedding model
              </label>
              <input
                id="rag-embed-model"
                style={input}
                value={embeddingModel}
                onChange={(e) => {
                  setEmbeddingModel(e.target.value);
                  const dims = KNOWN_DIMS[e.target.value];
                  if (dims) setEmbeddingDims(dims);
                }}
              />
            </div>
            <div>
              <label style={label} htmlFor="rag-embed-dims">
                Embedding dimensions
              </label>
              <input
                id="rag-embed-dims"
                type="number"
                style={input}
                min={32}
                value={embeddingDims}
                onChange={(e) => setEmbeddingDims(Number(e.target.value))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={label} htmlFor="rag-chunk">
                  Chunk size
                </label>
                <input
                  id="rag-chunk"
                  type="number"
                  style={input}
                  min={64}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={label} htmlFor="rag-overlap">
                  Chunk overlap
                </label>
                <input
                  id="rag-overlap"
                  type="number"
                  style={input}
                  min={0}
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label style={label} htmlFor="rag-sem">
                Search weight — semantic: {semantic.toFixed(2)}
              </label>
              <input
                id="rag-sem"
                type="range"
                min={0}
                max={1}
                step={0.05}
                style={{ width: '100%' }}
                value={semantic}
                onChange={(e) => setSemanticWeight(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={label} htmlFor="rag-kw">
                Search weight — keyword: {keyword.toFixed(2)}
              </label>
              <input
                id="rag-kw"
                type="range"
                min={0}
                max={1}
                step={0.05}
                style={{ width: '100%' }}
                value={keyword}
                onChange={(e) => setKeywordWeight(Number(e.target.value))}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rerankerEnabled}
                onChange={(e) => setRerankerEnabled(e.target.checked)}
              />
              Enable reranker
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
            <button type="button" style={btnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <button type="button" style={btnDanger} disabled={reindexing} onClick={() => void reindexAll()}>
              {reindexing ? 'Queueing…' : 'Reindex all'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RAGConfigPage;
