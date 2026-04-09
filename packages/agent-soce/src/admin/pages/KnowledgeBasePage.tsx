import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi.js';

interface Catalog {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string;
  color: string;
  isActive: boolean;
  _count?: { documents: number };
}

interface KDocument {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: string;
  chunkCount: number;
  errorMessage: string | null;
  sourceUrl: string | null;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChunkRow {
  id: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
}

interface ChunksResponse {
  chunks: ChunkRow[];
  total: number;
  page: number;
  pages: number;
}

interface Stats {
  catalogs: number;
  documents: number;
  totalChunks: number;
  embeddedChunks: number;
  pendingEmbeddings: number;
}

const ACCEPT = '.pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const KnowledgeBasePage: React.FC = () => {
  const { get, post, put, del } = useApi();

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [documents, setDocuments] = useState<KDocument[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [catalogForm, setCatalogForm] = useState({ name: '', description: '', icon: '📁', color: '#0073E6' });

  const [showChunks, setShowChunks] = useState<string | null>(null);
  const [chunksData, setChunksData] = useState<ChunksResponse | null>(null);
  const [chunksPage, setChunksPage] = useState(1);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL ingestion
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlAdding, setUrlAdding] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Action-level notifications
  const [actionMsg, setActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const showActionMsg = (type: 'error' | 'success', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Polling for processing documents
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCatalogs = useCallback(async () => {
    const data = await get<Catalog[]>('/admin/knowledge/catalogs');
    setCatalogs(data ?? []);
  }, []);

  const loadStats = useCallback(async () => {
    const data = await get<Stats>('/admin/knowledge/stats');
    setStats(data);
  }, []);

  const loadDocuments = useCallback(async (catalogId: string) => {
    setLoadingDocs(true);
    const data = await get<KDocument[]>(`/admin/knowledge/catalogs/${catalogId}/documents`);
    setDocuments(data ?? []);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadCatalogs(), loadStats()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load knowledge base data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCatalog) loadDocuments(selectedCatalog.id);
    else setDocuments([]);
  }, [selectedCatalog?.id]);

  // Poll for documents that are processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (hasProcessing && selectedCatalog) {
      pollRef.current = setInterval(() => {
        loadDocuments(selectedCatalog.id);
        loadStats();
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [documents, selectedCatalog?.id]);

  const openCreateCatalog = () => {
    setEditingCatalog(null);
    setCatalogForm({ name: '', description: '', icon: '📁', color: '#0073E6' });
    setShowCatalogForm(true);
  };

  const openEditCatalog = (c: Catalog) => {
    setEditingCatalog(c);
    setCatalogForm({ name: c.name, description: c.description ?? '', icon: c.icon, color: c.color });
    setShowCatalogForm(true);
  };

  const handleSaveCatalog = async () => {
    if (editingCatalog) {
      await put(`/admin/knowledge/catalogs/${editingCatalog.id}`, catalogForm);
    } else {
      await post('/admin/knowledge/catalogs', catalogForm);
    }
    setShowCatalogForm(false);
    await loadCatalogs();
  };

  const handleDeleteCatalog = async (c: Catalog) => {
    if (!confirm(`¿Eliminar catálogo "${c.name}" y todos sus documentos?`)) return;
    await del(`/admin/knowledge/catalogs/${c.id}`);
    if (selectedCatalog?.id === c.id) { setSelectedCatalog(null); setDocuments([]); }
    await Promise.all([loadCatalogs(), loadStats()]);
  };

  const handleUpload = async (files: FileList | File[]) => {
    if (!selectedCatalog || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }

    try {
      const res = await fetch(
        `${(window as Record<string, unknown>).__agentSoceApiBase ?? ''}/api/v1/agent-soce/admin/knowledge/catalogs/${selectedCatalog.id}/documents`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionStorage.getItem('agent_soce_admin_token') ?? ''}` },
          body: formData,
        },
      );
      if (!res.ok) throw new Error(await res.text());
    } catch { /* swallow — documents will appear via polling */ }

    setUploading(false);
    await loadDocuments(selectedCatalog.id);
    await loadStats();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const handleDeleteDoc = async (doc: KDocument) => {
    if (!confirm(`¿Eliminar "${doc.fileName}"?`)) return;
    try {
      await del(`/admin/knowledge/documents/${doc.id}`);
      if (selectedCatalog) await loadDocuments(selectedCatalog.id);
      await loadStats();
      showActionMsg('success', `"${doc.title}" eliminado correctamente.`);
    } catch (e) {
      showActionMsg('error', `No se pudo eliminar el documento: ${(e as Error).message}`);
    }
  };

  const handleReprocess = async (doc: KDocument) => {
    try {
      await post(`/admin/knowledge/documents/${doc.id}/reprocess`, {});
      if (selectedCatalog) await loadDocuments(selectedCatalog.id);
      showActionMsg('success', 'Reprocesando documento…');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('400')) {
        showActionMsg('error', 'Este documento no tiene texto almacenado. Elimínalo y vuelve a cargarlo.');
      } else {
        showActionMsg('error', `Error al reprocesar: ${msg}`);
      }
    }
  };

  const handleRecrawl = async (doc: KDocument) => {
    try {
      await post(`/admin/knowledge/documents/${doc.id}/recrawl`, {});
      if (selectedCatalog) await loadDocuments(selectedCatalog.id);
      showActionMsg('success', 'Re-crawl iniciado…');
    } catch (e) {
      showActionMsg('error', `Error al re-crawlear: ${(e as Error).message}`);
    }
  };

  const handleAddUrl = async () => {
    if (!selectedCatalog || !urlInput.trim()) return;
    setUrlAdding(true);
    setUrlError(null);
    try {
      new URL(urlInput.trim()); // validate format client-side first
      await post(`/admin/knowledge/catalogs/${selectedCatalog.id}/web-pages`, {
        url: urlInput.trim(),
        title: urlTitle.trim() || undefined,
      });
      setUrlInput('');
      setUrlTitle('');
      setShowUrlForm(false);
      await loadDocuments(selectedCatalog.id);
      await loadStats();
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Error al agregar la URL');
    } finally {
      setUrlAdding(false);
    }
  };

  const openChunks = async (docId: string) => {
    setShowChunks(docId);
    setChunksPage(1);
    const data = await get<ChunksResponse>(`/admin/knowledge/documents/${docId}/chunks?page=1&limit=10`);
    setChunksData(data);
  };

  const loadChunksPage = async (page: number) => {
    if (!showChunks) return;
    setChunksPage(page);
    const data = await get<ChunksResponse>(`/admin/knowledge/documents/${showChunks}/chunks?page=${page}&limit=10`);
    setChunksData(data);
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#F1F5F9', color: '#64748B' },
      processing: { bg: '#FEF3C7', color: '#92400E' },
      indexed: { bg: '#DCFCE7', color: '#166534' },
      error: { bg: '#FEF2F2', color: '#991B1B' },
    };
    const s = map[status] ?? map.pending;
    return { background: s.bg, color: s.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-block' };
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div style={S.loading}>Cargando...</div>;
  if (error) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ background: '#fef2f2', color: '#991b1b', padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
        <strong>Error:</strong> {error}
      </div>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        Verifica que el backend de Agent SOCE esté actualizado y las rutas de knowledge base estén registradas.
      </p>
      <button type="button" onClick={() => { setError(null); setLoading(true); void Promise.all([loadCatalogs(), loadStats()]).then(() => setLoading(false)).catch((e) => { setError(e instanceof Error ? e.message : 'Retry failed'); setLoading(false); }); }} style={{ marginTop: 12, padding: '8px 20px', background: '#0073E6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        Reintentar
      </button>
    </div>
  );

  return (
    <div style={S.wrap}>
      {/* Action notification banner */}
      {actionMsg && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: actionMsg.type === 'error' ? '#FEF2F2' : '#F0FFF4',
          color: actionMsg.type === 'error' ? '#991B1B' : '#14532D',
          border: `1px solid ${actionMsg.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
          borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)', maxWidth: 380,
        }}>
          {actionMsg.type === 'error' ? '⚠️ ' : '✅ '}{actionMsg.text}
        </div>
      )}

      {/* Sidebar: Catalogs */}
      <div style={S.sidebar}>
        <p style={S.sideTitle}>Catálogos</p>
        <button style={S.btn} onClick={openCreateCatalog}>+ Nuevo Catálogo</button>

        {catalogs.map((c) => (
          <div
            key={c.id}
            style={S.catalogCard(selectedCatalog?.id === c.id)}
            onClick={() => setSelectedCatalog(c)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.catalogName}>{c.name}</div>
                <div style={S.catalogMeta}>{c._count?.documents ?? 0} documentos</div>
              </div>
            </div>
            <div style={S.catalogActions} onClick={(e) => e.stopPropagation()}>
              <button style={S.btnSm} onClick={() => openEditCatalog(c)}>Editar</button>
              <button style={{ ...S.btnSm, color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => handleDeleteCatalog(c)}>Eliminar</button>
            </div>
          </div>
        ))}

        {/* Global stats */}
        {stats && (
          <div style={S.statsBox}>
            <div style={S.statRow}><span>Catálogos</span><strong>{stats.catalogs}</strong></div>
            <div style={S.statRow}><span>Documentos</span><strong>{stats.documents}</strong></div>
            <div style={S.statRow}><span>Chunks totales</span><strong>{stats.totalChunks}</strong></div>
            <div style={S.statRow}><span>Con embedding</span><strong>{stats.embeddedChunks}</strong></div>
            <div style={S.statRow}><span>Pendientes</span><strong>{stats.pendingEmbeddings}</strong></div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={S.main}>
        {!selectedCatalog ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#718096' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, margin: 0 }}>Selecciona un catálogo para gestionar sus documentos.</p>
            <p style={{ fontSize: 13, color: '#A0AEC0', marginTop: 8 }}>
              Los documentos subidos se procesan automáticamente: extracción de texto, chunking y generación de embeddings.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{selectedCatalog.icon} {selectedCatalog.name}</h3>
                {selectedCatalog.description && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#718096' }}>{selectedCatalog.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={{ ...S.btn, background: '#fff', color: '#0073E6', border: '1.5px solid #0073E6' }} onClick={() => { setShowUrlForm((v) => !v); setUrlError(null); }}>
                  🌐 Agregar URL
                </button>
                <button style={S.btn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Subiendo...' : '📄 Subir Documentos'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* URL form */}
            {showUrlForm && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1E40AF', marginBottom: 10 }}>🌐 Agregar página web</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, minWidth: 220 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>URL *</label>
                    <input
                      style={{ ...S.input, margin: 0 }}
                      placeholder="https://www.sercop.gob.ec/normativa/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleAddUrl(); }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Título (opcional)</label>
                    <input
                      style={{ ...S.input, margin: 0 }}
                      placeholder="Ej: Reglamento SERCOP"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleAddUrl(); }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btn} onClick={() => void handleAddUrl()} disabled={urlAdding || !urlInput.trim()}>
                      {urlAdding ? 'Procesando...' : 'Agregar'}
                    </button>
                    <button style={{ ...S.btnSm, padding: '6px 12px' }} onClick={() => { setShowUrlForm(false); setUrlInput(''); setUrlTitle(''); setUrlError(null); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
                {urlError && <div style={{ marginTop: 8, fontSize: 12, color: '#991B1B', background: '#FEF2F2', padding: '6px 10px', borderRadius: 6 }}>{urlError}</div>}
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6B7280' }}>
                  La página se descarga y procesa automáticamente. Solo se indexa el contenido de texto principal (se eliminan menús y publicidad).
                </p>
              </div>
            )}

            {/* Drop zone */}
            <div
              style={{ ...S.dropZone, borderColor: dragOver ? '#0073E6' : '#CBD5E0', background: dragOver ? '#EBF8FF' : '#F7FAFC' }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span style={{ fontSize: 28 }}>📁</span>
              <span style={{ fontSize: 13, color: '#718096' }}>Arrastra archivos aquí (PDF, TXT, MD, DOCX) o usa el botón de subir</span>
            </div>

            {/* Documents table */}
            {loadingDocs ? <div style={S.loading}>Cargando documentos...</div> : (
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Nombre', 'Tipo', 'Tamaño', 'Chunks', 'Estado', 'Fecha', ''].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 && (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#A0AEC0', padding: 32 }}>Sin documentos aún</td></tr>
                  )}
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={S.td}>
                        <strong>{doc.title}</strong>
                        {doc.sourceUrl ? (
                          <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>
                            🌐 <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>{doc.sourceUrl.length > 60 ? doc.sourceUrl.slice(0, 60) + '…' : doc.sourceUrl}</a>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#A0AEC0' }}>{doc.fileName}</div>
                        )}
                        {doc.lastCrawledAt && (
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Último crawl: {new Date(doc.lastCrawledAt).toLocaleString()}</div>
                        )}
                      </td>
                      <td style={S.td}>
                        <code style={{ fontSize: 11, background: doc.mimeType === 'text/html' ? '#EFF6FF' : '#F0F4F8', color: doc.mimeType === 'text/html' ? '#1D4ED8' : 'inherit', padding: '2px 6px', borderRadius: 4 }}>
                          {doc.mimeType === 'text/html' ? 'web' : doc.mimeType.split('/').pop()}
                        </code>
                      </td>
                      <td style={S.td}>{doc.fileSizeBytes > 0 ? formatSize(doc.fileSizeBytes) : '—'}</td>
                      <td style={S.td}>{doc.chunkCount}</td>
                      <td style={S.td}>
                        <span style={statusBadge(doc.status)}>{doc.status === 'processing' ? '⏳ ' : ''}{doc.status}</span>
                        {doc.errorMessage && <div style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>{doc.errorMessage}</div>}
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: '#718096' }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button style={S.btnSm} onClick={() => openChunks(doc.id)}>Chunks</button>
                        {doc.mimeType === 'text/html' && doc.sourceUrl ? (
                          <button style={S.btnSm} title="Re-descargar página" onClick={() => void handleRecrawl(doc)}>↻</button>
                        ) : (
                          <button style={S.btnSm} onClick={() => void handleReprocess(doc)}>↻</button>
                        )}
                        <button style={{ ...S.btnSm, color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => void handleDeleteDoc(doc)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Catalog form modal */}
      {showCatalogForm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: '0 0 16px' }}>{editingCatalog ? 'Editar Catálogo' : 'Nuevo Catálogo'}</h3>
            <label style={S.label}>Nombre</label>
            <input style={S.input} value={catalogForm.name} onChange={(e) => setCatalogForm((f) => ({ ...f, name: e.target.value }))} />
            <label style={S.label}>Descripción</label>
            <input style={S.input} value={catalogForm.description} onChange={(e) => setCatalogForm((f) => ({ ...f, description: e.target.value }))} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Icono</label>
                <input style={S.input} value={catalogForm.icon} onChange={(e) => setCatalogForm((f) => ({ ...f, icon: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Color</label>
                <input style={S.input} type="color" value={catalogForm.color} onChange={(e) => setCatalogForm((f) => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setShowCatalogForm(false)}>Cancelar</button>
              <button style={S.btn} onClick={handleSaveCatalog}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Chunks modal */}
      {showChunks && chunksData && (
        <div style={S.overlay} onClick={() => setShowChunks(null)}>
          <div style={{ ...S.modal, width: 680, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Chunks del documento ({chunksData.total} total)</h3>
              <button style={S.btnSm} onClick={() => setShowChunks(null)}>✕</button>
            </div>
            {chunksData.chunks.map((chunk, i) => (
              <div key={chunk.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4A5568' }}>#{(chunksPage - 1) * 10 + i + 1} — {chunk.title}</span>
                  <span style={{ fontSize: 11, color: '#A0AEC0' }}>{chunk.source}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#2D3748', lineHeight: 1.5 }}>
                  {chunk.content.length > 400 ? chunk.content.slice(0, 400) + '...' : chunk.content}
                </p>
              </div>
            ))}
            {chunksData.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button style={S.btnSm} disabled={chunksPage <= 1} onClick={() => loadChunksPage(chunksPage - 1)}>← Anterior</button>
                <span style={{ fontSize: 13, padding: '4px 8px' }}>Página {chunksPage} de {chunksData.pages}</span>
                <button style={S.btnSm} disabled={chunksPage >= chunksData.pages} onClick={() => loadChunksPage(chunksPage + 1)}>Siguiente →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const S: Record<string, React.CSSProperties | ((...args: unknown[]) => React.CSSProperties)> = {
  wrap: { display: 'flex', gap: 24, height: 'calc(100vh - 60px)', overflow: 'hidden', padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' },
  sidebar: { width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' },
  main: { flex: 1, overflowY: 'auto' },
  sideTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 12px' },
  btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%' },
  btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, marginLeft: 4 },
  catalogCard: ((active: boolean) => ({
    border: `2px solid ${active ? 'var(--agent-soce-primary,#0073E6)' : '#e2e8f0'}`,
    borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
    background: active ? '#EBF8FF' : '#fff', transition: 'border-color 0.2s',
  })) as unknown as React.CSSProperties,
  catalogName: { fontWeight: 600, fontSize: 14 },
  catalogMeta: { fontSize: 12, color: '#718096', marginTop: 2 },
  catalogActions: { display: 'flex', gap: 4, marginTop: 8 },
  statsBox: { marginTop: 16, padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F7FAFC', fontSize: 13 },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  dropZone: { border: '2px dashed #CBD5E0', borderRadius: 12, padding: '24px 16px', textAlign: 'center', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#718096', fontWeight: 600 },
  td: { padding: '10px 12px', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 12, padding: 24, width: 480, maxWidth: '90vw' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 },
  input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box', color: '#1a202c', background: '#fff' },
  loading: { textAlign: 'center', color: '#888', padding: 40 },
};
