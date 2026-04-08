import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  status: string;
  format: string;
  totalPairs: number;
  exportUrl: string | null;
  updatedAt: string;
  _count?: { entries: number };
}

interface Entry {
  id: string;
  userMessage: string;
  idealResponse: string;
  category: string | null;
  quality: string;
}

export const TrainingPage: React.FC = () => {
  const { get, post, put, del } = useApi();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDs, setSelectedDs] = useState<Dataset | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', format: 'jsonl' });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const loadDatasets = async () => {
    setLoading(true);
    const data = await get<Dataset[]>('/admin/training/datasets');
    setDatasets(data ?? []);
    setLoading(false);
  };

  const loadEntries = async (dsId: string) => {
    const data = await get<Entry[]>(`/admin/training/datasets/${dsId}/entries`);
    setEntries(data ?? []);
  };

  useEffect(() => { loadDatasets(); }, []);

  const handleSelectDs = (ds: Dataset) => {
    setSelectedDs(ds);
    loadEntries(ds.id);
  };

  const handleCreate = async () => {
    await post('/admin/training/datasets', form);
    setShowCreate(false);
    setForm({ name: '', description: '', format: 'jsonl' });
    loadDatasets();
  };

  const handleDelete = async (ds: Dataset) => {
    if (!confirm(`¿Eliminar dataset "${ds.name}"?`)) return;
    await del(`/admin/training/datasets/${ds.id}`);
    if (selectedDs?.id === ds.id) { setSelectedDs(null); setEntries([]); }
    loadDatasets();
  };

  const handleExport = async (ds: Dataset) => {
    const result = await post<{ exportUrl: string }>(`/admin/training/datasets/${ds.id}/export`, { format: ds.format });
    if (result?.exportUrl) window.open(result.exportUrl, '_blank');
    loadDatasets();
  };

  const handleSaveEntry = async () => {
    if (!editingEntry || !selectedDs) return;
    await put(`/admin/training/datasets/${selectedDs.id}/entries/${editingEntry.id}`, editingEntry);
    setEditingEntry(null);
    loadEntries(selectedDs.id);
  };

  const qualityColor = (q: string) => ({ good: '#38A169', needs_edit: '#F59E0B', rejected: '#EF4444', pending: '#6B7280' }[q] ?? '#6B7280');

  const S = {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)', display: 'flex', gap: 24, height: 'calc(100vh - 60px)', overflow: 'hidden' } as React.CSSProperties,
    sidebar: { width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: 8 },
    main: { flex: 1, overflowY: 'auto' as const },
    sideTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 12px' } as React.CSSProperties,
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%' } as React.CSSProperties,
    btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, marginLeft: 4 } as React.CSSProperties,
    dsCard: (active: boolean) => ({ border: `2px solid ${active ? 'var(--agent-soce-primary,#0073E6)' : '#e2e8f0'}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.2s', background: active ? '#EBF8FF' : '#fff' } as React.CSSProperties),
    dsName: { fontWeight: 600, fontSize: 14 } as React.CSSProperties,
    dsMeta: { fontSize: 12, color: '#718096', marginTop: 2 } as React.CSSProperties,
    dsActions: { display: 'flex', gap: 4, marginTop: 8 } as React.CSSProperties,
    entryCard: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12 } as React.CSSProperties,
    qualityBadge: (q: string) => ({ background: `${qualityColor(q)}20`, color: qualityColor(q), borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 } as React.CSSProperties),
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, padding: 24, width: 560, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' as const } as React.CSSProperties,
    label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 } as React.CSSProperties,
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' as const },
    textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 80 },
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.sidebar}>
        <p style={S.sideTitle}>Datasets de Entrenamiento</p>
        <button style={S.btn} onClick={() => setShowCreate(true)}>+ Nuevo Dataset</button>

        {loading ? <div style={S.loading}>Cargando...</div> : datasets.map(ds => (
          <div key={ds.id} style={S.dsCard(selectedDs?.id === ds.id)} onClick={() => handleSelectDs(ds)}>
            <div style={S.dsName}>{ds.name}</div>
            <div style={S.dsMeta}>{ds.totalPairs} pares · {ds.format.toUpperCase()} · {ds.status}</div>
            <div style={S.dsActions} onClick={e => e.stopPropagation()}>
              <button style={S.btnSm} onClick={() => handleExport(ds)}>⬇ Exportar</button>
              <button style={{ ...S.btnSm, color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => handleDelete(ds)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div style={S.main}>
        {!selectedDs ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#718096' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p>Selecciona un dataset para ver y curar sus entradas.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{selectedDs.name}</h3>
              <span style={{ fontSize: 13, color: '#718096' }}>{entries.length} entradas</span>
            </div>

            {entries.map(entry => (
              <div key={entry.id} style={S.entryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={S.qualityBadge(entry.quality)}>{entry.quality}</span>
                  <div>
                    {entry.category && <span style={{ fontSize: 12, color: '#718096', marginRight: 8 }}>{entry.category}</span>}
                    <button style={S.btnSm} onClick={() => setEditingEntry({ ...entry })}>Curar</button>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 12, color: '#718096', margin: '0 0 4px', fontWeight: 600 }}>Usuario:</p>
                  <p style={{ margin: 0, fontSize: 13 }}>{entry.userMessage}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#718096', margin: '0 0 4px', fontWeight: 600 }}>Respuesta ideal:</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#2D3748' }}>{entry.idealResponse}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showCreate && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: '0 0 16px' }}>Nuevo Dataset</h3>
            <label style={S.label}>Nombre</label>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <label style={S.label}>Descripción</label>
            <input style={S.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <label style={S.label}>Formato de Exportación</label>
            <select style={S.input as React.CSSProperties} value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
              <option value="jsonl">JSONL (genérico)</option>
              <option value="openai_ft">OpenAI Fine-tuning</option>
              <option value="alpaca">Alpaca</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setShowCreate(false)}>Cancelar</button>
              <button style={{ ...S.btn, width: 'auto' }} onClick={handleCreate}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {editingEntry && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: '0 0 16px' }}>Curar Entrada</h3>
            <label style={S.label}>Mensaje del usuario</label>
            <textarea style={S.textarea} value={editingEntry.userMessage} onChange={e => setEditingEntry(en => en ? { ...en, userMessage: e.target.value } : null)} />
            <label style={S.label}>Respuesta ideal</label>
            <textarea style={{ ...S.textarea, minHeight: 120 }} value={editingEntry.idealResponse} onChange={e => setEditingEntry(en => en ? { ...en, idealResponse: e.target.value } : null)} />
            <label style={S.label}>Categoría</label>
            <input style={S.input} value={editingEntry.category ?? ''} onChange={e => setEditingEntry(en => en ? { ...en, category: e.target.value } : null)} placeholder="normativa, proceso, guidance, data_query" />
            <label style={S.label}>Calidad</label>
            <select style={S.input as React.CSSProperties} value={editingEntry.quality} onChange={e => setEditingEntry(en => en ? { ...en, quality: e.target.value } : null)}>
              <option value="pending">Pendiente</option>
              <option value="good">Buena</option>
              <option value="needs_edit">Necesita edición</option>
              <option value="rejected">Rechazada</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setEditingEntry(null)}>Cancelar</button>
              <button style={{ ...S.btn, width: 'auto' }} onClick={handleSaveEntry}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
