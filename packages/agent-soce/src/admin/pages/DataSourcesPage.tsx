import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

interface DataSource {
  id: string;
  name: string;
  type: string;
  connectionUrl: string;
  schema: string | null;
  isActive: boolean;
  maxPoolSize: number;
  timeoutMs: number;
}

interface TestResult {
  ok: boolean;
  error?: string;
  latencyMs: number;
}

export const DataSourcesPage: React.FC = () => {
  const { get, post, put, del } = useApi();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DataSource | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ name: '', type: 'postgresql', connectionUrl: '', schema: 'public', maxPoolSize: 5, timeoutMs: 10000 });

  const load = async () => {
    setLoading(true);
    const data = await get<DataSource[]>('/admin/data-sources');
    setSources(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', type: 'postgresql', connectionUrl: '', schema: 'public', maxPoolSize: 5, timeoutMs: 10000 }); setShowForm(true); };
  const openEdit = (ds: DataSource) => { setEditing(ds); setForm({ name: ds.name, type: ds.type, connectionUrl: ds.connectionUrl, schema: ds.schema ?? 'public', maxPoolSize: ds.maxPoolSize, timeoutMs: ds.timeoutMs }); setShowForm(true); };

  const handleSave = async () => {
    if (editing) await put(`/admin/data-sources/${editing.id}`, form);
    else await post('/admin/data-sources', form);
    setShowForm(false);
    load();
  };

  const handleDelete = async (ds: DataSource) => {
    if (!confirm(`¿Eliminar data source "${ds.name}"?`)) return;
    await del(`/admin/data-sources/${ds.id}`);
    load();
  };

  const handleTest = async (ds: DataSource) => {
    setTesting(t => ({ ...t, [ds.id]: true }));
    try {
      const result = await post<TestResult>(`/admin/data-sources/${ds.id}/test`, {});
      setTestResults(r => ({ ...r, [ds.id]: result }));
    } catch (e) {
      setTestResults(r => ({ ...r, [ds.id]: { ok: false, error: String(e), latencyMs: 0 } }));
    } finally {
      setTesting(t => ({ ...t, [ds.id]: false }));
    }
  };

  const S = {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 } as React.CSSProperties,
    btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, marginLeft: 4 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#718096', fontWeight: 600 },
    td: { padding: '10px 12px', fontSize: 14 } as React.CSSProperties,
    label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 } as React.CSSProperties,
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' as const },
    select: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14 } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, padding: 24, width: 520, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' as const } as React.CSSProperties,
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
    testOk: { color: '#38A169', fontSize: 12, marginLeft: 8 } as React.CSSProperties,
    testFail: { color: '#E53E3E', fontSize: 12, marginLeft: 8 } as React.CSSProperties,
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.title}>Data Sources</h2>
        <button style={S.btn} onClick={openCreate}>+ Nueva Fuente</button>
      </div>

      {loading ? <div style={S.loading}>Cargando...</div> : (
        <table style={S.table}>
          <thead>
            <tr>{['Nombre', 'Tipo', 'Schema', 'Estado', 'Test', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {sources.map(ds => (
              <tr key={ds.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={S.td}><strong>{ds.name}</strong></td>
                <td style={S.td}><code style={{ fontSize: 12, background: '#f0f4f8', padding: '2px 6px', borderRadius: 4 }}>{ds.type}</code></td>
                <td style={S.td}>{ds.schema ?? 'public'}</td>
                <td style={S.td}><span style={{ color: ds.isActive ? '#38A169' : '#E53E3E', fontWeight: 600, fontSize: 13 }}>{ds.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td style={S.td}>
                  <button style={S.btnSm} onClick={() => handleTest(ds)} disabled={testing[ds.id]}>
                    {testing[ds.id] ? '...' : 'Probar'}
                  </button>
                  {testResults[ds.id] && (
                    <span style={testResults[ds.id].ok ? S.testOk : S.testFail}>
                      {testResults[ds.id].ok ? `✓ ${testResults[ds.id].latencyMs}ms` : `✗ ${testResults[ds.id].error}`}
                    </span>
                  )}
                </td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  <button style={S.btnSm} onClick={() => openEdit(ds)}>Editar</button>
                  <button style={{ ...S.btnSm, color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => handleDelete(ds)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: '0 0 4px' }}>{editing ? 'Editar Data Source' : 'Nuevo Data Source'}</h3>
            <p style={{ color: '#718096', fontSize: 13, margin: '0 0 16px' }}>La URL de conexión se almacena de forma cifrada.</p>
            <label style={S.label}>Nombre</label>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ej. sercop_transactional" />
            <label style={S.label}>Tipo</label>
            <select style={S.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
              <option value="readonly_replica">Read-Only Replica</option>
            </select>
            <label style={S.label}>Connection URL</label>
            <input style={S.input} type="password" value={form.connectionUrl} onChange={e => setForm(f => ({ ...f, connectionUrl: e.target.value }))} placeholder="postgresql://user:pass@host:5432/db" />
            <label style={S.label}>Schema</label>
            <input style={S.input} value={form.schema} onChange={e => setForm(f => ({ ...f, schema: e.target.value }))} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Pool Size</label>
                <input style={S.input} type="number" value={form.maxPoolSize} onChange={e => setForm(f => ({ ...f, maxPoolSize: Number(e.target.value) }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Timeout (ms)</label>
                <input style={S.input} type="number" value={form.timeoutMs} onChange={e => setForm(f => ({ ...f, timeoutMs: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={S.btn} onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
