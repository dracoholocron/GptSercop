import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

interface AgentUser {
  id: string;
  externalId: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
  roles: Array<{ role: { id: string; name: string } }>;
}

interface AgentRole {
  id: string;
  name: string;
}

export const UsersPage: React.FC = () => {
  const { get, post, put } = useApi();
  const [users, setUsers] = useState<AgentUser[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgentUser | null>(null);
  const [form, setForm] = useState({ externalId: '', email: '', displayName: '', roleIds: [] as string[] });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [usersData, rolesData] = await Promise.all([
      get<AgentUser[]>('/admin/users'),
      get<AgentRole[]>('/admin/roles'),
    ]);
    setUsers(usersData ?? []);
    setRoles(rolesData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ externalId: '', email: '', displayName: '', roleIds: [] });
    setShowForm(true);
  };
  const openEdit = (u: AgentUser) => {
    setEditing(u);
    setForm({ externalId: u.externalId, email: u.email, displayName: u.displayName, roleIds: u.roles.map(r => r.role.id) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) {
      await put(`/admin/users/${editing.id}`, { email: form.email, displayName: form.displayName, roleIds: form.roleIds });
    } else {
      await post('/admin/users', form);
    }
    setShowForm(false);
    load();
  };

  const toggleRole = (id: string) => {
    setForm(f => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter(r => r !== id) : [...f.roleIds, id],
    }));
  };

  const filtered = users.filter(u =>
    !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const S = {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 } as React.CSSProperties,
    btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, marginLeft: 4 } as React.CSSProperties,
    searchBar: { width: 260, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, marginBottom: 16 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#718096', fontWeight: 600 },
    td: { padding: '10px 12px', fontSize: 14 } as React.CSSProperties,
    pill: { background: '#EBF8FF', color: '#2B6CB0', borderRadius: 12, padding: '2px 8px', fontSize: 12, marginRight: 4, display: 'inline-block' } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, padding: 24, width: 480, maxWidth: '90vw' } as React.CSSProperties,
    label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 } as React.CSSProperties,
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' as const },
    roleChip: (active: boolean) => ({ display: 'inline-block', border: '1px solid', borderRadius: 6, padding: '4px 10px', margin: '4px 4px 0 0', cursor: 'pointer', fontSize: 13, background: active ? 'var(--agent-soce-primary,#0073E6)' : 'transparent', color: active ? '#fff' : '#333', borderColor: active ? 'var(--agent-soce-primary,#0073E6)' : '#ccc' } as React.CSSProperties),
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.title}>Usuarios</h2>
        <button style={S.btn} onClick={openCreate}>+ Nuevo Usuario</button>
      </div>

      <input style={S.searchBar} placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <div style={S.loading}>Cargando...</div> : (
        <table style={S.table}>
          <thead>
            <tr>{['Nombre', 'Email', 'ID Externo', 'Roles', 'Estado', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={S.td}><strong>{u.displayName}</strong></td>
                <td style={S.td}>{u.email}</td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#718096' }}>{u.externalId}</td>
                <td style={S.td}>{u.roles.map(r => <span key={r.role.id} style={S.pill}>{r.role.name}</span>)}</td>
                <td style={S.td}><span style={{ color: u.status === 'active' ? '#38A169' : '#E53E3E', fontWeight: 600, fontSize: 13 }}>{u.status}</span></td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  <button style={S.btnSm} onClick={() => openEdit(u)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: '0 0 16px' }}>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            {!editing && (
              <>
                <label style={S.label}>ID Externo (del sistema host)</label>
                <input style={S.input} value={form.externalId} onChange={e => setForm(f => ({ ...f, externalId: e.target.value }))} />
              </>
            )}
            <label style={S.label}>Email</label>
            <input style={S.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <label style={S.label}>Nombre</label>
            <input style={S.input} value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
            <label style={S.label}>Roles</label>
            <div>{roles.map(r => <span key={r.id} style={S.roleChip(form.roleIds.includes(r.id))} onClick={() => toggleRole(r.id)}>{r.name}</span>)}</div>
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
