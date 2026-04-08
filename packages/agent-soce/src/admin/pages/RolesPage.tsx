import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

interface AgentRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  _count?: { users: number };
}

export const RolesPage: React.FC = () => {
  const { get, post, put, del } = useApi();
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgentRole | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await get<AgentRole[]>('/admin/roles');
    setRoles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setShowForm(true); };
  const openEdit = (r: AgentRole) => { setEditing(r); setForm({ name: r.name, description: r.description ?? '' }); setShowForm(true); };

  const handleSave = async () => {
    try {
      setError(null);
      if (editing) {
        await put(`/admin/roles/${editing.id}`, form);
      } else {
        await post('/admin/roles', form);
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDelete = async (r: AgentRole) => {
    if (r.isSystem) return;
    if (!confirm(`¿Eliminar rol "${r.name}"?`)) return;
    await del(`/admin/roles/${r.id}`);
    load();
  };

  return (
    <div style={pg.wrap}>
      <div style={pg.header}>
        <h2 style={pg.title}>Roles</h2>
        <button style={pg.btn} onClick={openCreate}>+ Nuevo Rol</button>
      </div>

      {error && <div style={pg.errBanner}>{error}</div>}

      {loading ? <div style={pg.loading}>Cargando...</div> : (
        <table style={pg.table}>
          <thead>
            <tr>{['Nombre', 'Descripción', 'Usuarios', 'Sistema', ''].map(h => <th key={h} style={pg.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} style={pg.tr}>
                <td style={pg.td}><strong>{r.name}</strong></td>
                <td style={pg.td}>{r.description ?? '—'}</td>
                <td style={pg.td}>{r._count?.users ?? 0}</td>
                <td style={pg.td}>{r.isSystem ? <span style={pg.badge}>Sistema</span> : '—'}</td>
                <td style={{ ...pg.td, textAlign: 'right' }}>
                  <button style={pg.btnSm} onClick={() => openEdit(r)}>Editar</button>
                  {!r.isSystem && <button style={{ ...pg.btnSm, ...pg.btnDanger }} onClick={() => handleDelete(r)}>Eliminar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={pg.overlay}>
          <div style={pg.modal}>
            <h3 style={{ margin: '0 0 16px' }}>{editing ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <label style={pg.label}>Nombre</label>
            <input style={pg.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={editing?.isSystem} />
            <label style={pg.label}>Descripción</label>
            <input style={pg.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={pg.btnSm} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={pg.btn} onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const pg = styles();
function styles() {
  return {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 } as React.CSSProperties,
    btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, marginLeft: 4 } as React.CSSProperties,
    btnDanger: { color: '#e53e3e', borderColor: '#e53e3e' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#718096', fontWeight: 600 },
    tr: { borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
    td: { padding: '10px 12px', fontSize: 14 } as React.CSSProperties,
    badge: { background: '#EBF8FF', color: '#2B6CB0', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } as React.CSSProperties,
    label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 } as React.CSSProperties,
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' as const },
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
    errBanner: { background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 } as React.CSSProperties,
  };
}
