import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';

interface Role { id: string; name: string }
interface DataSource { id: string; name: string }
interface Permission {
  id?: string;
  roleId: string;
  dataSourceId: string;
  tableName: string;
  allowedColumns: string[];
  rowFilter: string | null;
  accessLevel: string;
}

export const PermissionsPage: React.FC = () => {
  const { get, put } = useApi();
  const [roles, setRoles] = useState<Role[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Permission[]>([]);

  useEffect(() => {
    (async () => {
      const [r, s] = await Promise.all([
        get<Role[]>('/admin/roles'),
        get<DataSource[]>('/admin/data-sources'),
      ]);
      setRoles(r ?? []);
      setSources(s ?? []);
      if (r?.[0]) setSelectedRole(r[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    get<Permission[]>(`/admin/permissions?roleId=${selectedRole}`).then(p => {
      setPermissions(p ?? []);
      setDirty([]);
    });
  }, [selectedRole]);

  const getPermission = (roleId: string, dsId: string, table: string): Permission | undefined =>
    [...permissions, ...dirty].find(p => p.roleId === roleId && p.dataSourceId === dsId && p.tableName === table);

  const updatePermission = (roleId: string, dsId: string, table: string, field: keyof Permission, value: unknown) => {
    const existing = getPermission(roleId, dsId, table);
    const updated: Permission = existing
      ? { ...existing, [field]: value }
      : { roleId, dataSourceId: dsId, tableName: table, allowedColumns: [], rowFilter: null, accessLevel: 'none', [field]: value };

    setDirty(prev => {
      const idx = prev.findIndex(p => p.roleId === roleId && p.dataSourceId === dsId && p.tableName === table);
      if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
      return [...prev, updated];
    });
  };

  const handleSave = async () => {
    if (!dirty.length) return;
    setSaving(true);
    await put('/admin/permissions', dirty);
    const updated = await get<Permission[]>(`/admin/permissions?roleId=${selectedRole}`);
    setPermissions(updated ?? []);
    setDirty([]);
    setSaving(false);
  };

  const accessLevels = ['none', 'read', 'aggregate'];
  const commonTables = ['*', 'Tender', 'Contract', 'Bid', 'Provider', 'Entity'];

  const S = {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    roleRow: { display: 'flex', gap: 8, marginBottom: 20 } as React.CSSProperties,
    roleBtn: (active: boolean) => ({ border: `2px solid ${active ? 'var(--agent-soce-primary,#0073E6)' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: active ? 700 : 400, background: active ? '#EBF8FF' : 'transparent', color: active ? 'var(--agent-soce-primary,#0073E6)' : '#333', fontSize: 14 } as React.CSSProperties),
    saveBtn: { background: dirty.length ? 'var(--agent-soce-primary,#0073E6)' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: dirty.length ? 'pointer' : 'default', fontWeight: 600, fontSize: 14 } as React.CSSProperties,
    dsSection: { marginBottom: 32 } as React.CSSProperties,
    dsTitle: { fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#4A5568' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 16 },
    th: { textAlign: 'left' as const, padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontSize: 12, color: '#718096', fontWeight: 600, whiteSpace: 'nowrap' as const },
    td: { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
    select: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13 } as React.CSSProperties,
    filterInput: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12, width: 200 } as React.CSSProperties,
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
  };

  if (loading) return <div style={S.loading}>Cargando...</div>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.title}>Matriz de Permisos</h2>
        <button style={S.saveBtn} onClick={handleSave} disabled={saving || !dirty.length}>
          {saving ? 'Guardando...' : `Guardar${dirty.length ? ` (${dirty.length})` : ''}`}
        </button>
      </div>

      <div style={S.roleRow}>
        {roles.map(r => (
          <button key={r.id} style={S.roleBtn(selectedRole === r.id)} onClick={() => setSelectedRole(r.id)}>{r.name}</button>
        ))}
      </div>

      {sources.map(ds => (
        <div key={ds.id} style={S.dsSection}>
          <p style={S.dsTitle}>📦 {ds.name}</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Tabla</th>
                <th style={S.th}>Nivel de Acceso</th>
                <th style={S.th}>Filtro de Fila (SQL)</th>
                <th style={S.th}>Columnas Permitidas</th>
              </tr>
            </thead>
            <tbody>
              {commonTables.map(table => {
                const perm = getPermission(selectedRole, ds.id, table);
                const isDirty = dirty.some(p => p.roleId === selectedRole && p.dataSourceId === ds.id && p.tableName === table);
                return (
                  <tr key={table} style={{ background: isDirty ? '#FFFFF0' : 'transparent' }}>
                    <td style={{ ...S.td, fontWeight: table === '*' ? 700 : 400, fontFamily: table !== '*' ? 'monospace' : 'inherit' }}>
                      {table === '*' ? '* (todas)' : table}
                    </td>
                    <td style={S.td}>
                      <select
                        style={S.select}
                        value={perm?.accessLevel ?? 'none'}
                        onChange={e => updatePermission(selectedRole, ds.id, table, 'accessLevel', e.target.value)}
                      >
                        {accessLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td style={S.td}>
                      <input
                        style={S.filterInput}
                        value={perm?.rowFilter ?? ''}
                        placeholder={`ej. "entityId" = :userEntityId`}
                        onChange={e => updatePermission(selectedRole, ds.id, table, 'rowFilter', e.target.value || null)}
                      />
                    </td>
                    <td style={S.td}>
                      <input
                        style={S.filterInput}
                        value={(perm?.allowedColumns ?? []).join(', ')}
                        placeholder="vacío = todas"
                        onChange={e => updatePermission(selectedRole, ds.id, table, 'allowedColumns', e.target.value ? e.target.value.split(',').map(c => c.trim()) : [])}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};
