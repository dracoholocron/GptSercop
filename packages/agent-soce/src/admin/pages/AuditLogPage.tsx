import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi.js';

interface AuditEntry {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: { displayName: string; email: string };
}

interface Stats {
  totalMessages: number;
  avgLatencyMs: number;
  avgRating: number;
}

export const AuditLogPage: React.FC = () => {
  const { get } = useApi();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', from: '', to: '' });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    const [entriesData, statsData] = await Promise.all([
      get<AuditEntry[]>(`/admin/audit?${params.toString()}`),
      get<Stats>('/admin/interactions/stats'),
    ]);
    setEntries(entriesData ?? []);
    setStats(statsData);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const actionColor = (action: string) => {
    switch (action) {
      case 'chat': return '#3B82F6';
      case 'data_query': return '#8B5CF6';
      case 'tool_call': return '#F59E0B';
      case 'admin_change': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const exportCSV = () => {
    const rows = [['ID', 'Fecha', 'Usuario', 'Acción', 'IP', 'Detalle']];
    entries.forEach(e => rows.push([e.id, e.createdAt, e.user.displayName, e.action, e.ipAddress ?? '', JSON.stringify(e.detail)]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const S = {
    wrap: { padding: 24, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    statsRow: { display: 'flex', gap: 16, marginBottom: 20 } as React.CSSProperties,
    statCard: { background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 20px', flex: 1 } as React.CSSProperties,
    statVal: { fontSize: 24, fontWeight: 700, color: 'var(--agent-soce-primary,#0073E6)' } as React.CSSProperties,
    statLabel: { fontSize: 12, color: '#718096', marginTop: 2 } as React.CSSProperties,
    filters: { display: 'flex', gap: 12, marginBottom: 16 } as React.CSSProperties,
    filterInput: { border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14 } as React.CSSProperties,
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 } as React.CSSProperties,
    btnSm: { background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#718096', fontWeight: 600 },
    td: { padding: '10px 12px', fontSize: 13 } as React.CSSProperties,
    badge: (color: string) => ({ background: `${color}20`, color, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 } as React.CSSProperties),
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, padding: 24, width: 560, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const } as React.CSSProperties,
    loading: { textAlign: 'center' as const, color: '#888', padding: 40 },
    pre: { background: '#F7FAFC', borderRadius: 8, padding: 16, fontSize: 12, overflowX: 'auto' as const, fontFamily: 'monospace' } as React.CSSProperties,
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.title}>Registro de Auditoría</h2>
        <button style={S.btn} onClick={exportCSV}>⬇ Exportar CSV</button>
      </div>

      {stats && (
        <div style={S.statsRow}>
          <div style={S.statCard}><div style={S.statVal}>{stats.totalMessages.toLocaleString()}</div><div style={S.statLabel}>Total mensajes</div></div>
          <div style={S.statCard}><div style={S.statVal}>{stats.avgLatencyMs > 0 ? `${Math.round(stats.avgLatencyMs)}ms` : '—'}</div><div style={S.statLabel}>Latencia promedio</div></div>
          <div style={S.statCard}><div style={S.statVal}>{stats.avgRating > 0 ? stats.avgRating.toFixed(1) + '⭐' : '—'}</div><div style={S.statLabel}>Calificación promedio</div></div>
        </div>
      )}

      <div style={S.filters}>
        <input style={S.filterInput} placeholder="Filtrar por userId..." value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} />
        <input style={S.filterInput} type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        <input style={S.filterInput} type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        <button style={S.btn} onClick={load}>Filtrar</button>
      </div>

      {loading ? <div style={S.loading}>Cargando...</div> : (
        <table style={S.table}>
          <thead>
            <tr>{['Fecha', 'Usuario', 'Acción', 'IP', 'Detalle', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={S.td}>{new Date(e.createdAt).toLocaleString()}</td>
                <td style={S.td}>{e.user.displayName}</td>
                <td style={S.td}><span style={S.badge(actionColor(e.action))}>{e.action}</span></td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{e.ipAddress ?? '—'}</td>
                <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{JSON.stringify(e.detail)}</td>
                <td style={S.td}><button style={S.btnSm} onClick={() => setSelectedEntry(e)}>Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedEntry && (
        <div style={S.overlay} onClick={() => setSelectedEntry(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Detalle de Auditoría</h3>
              <button style={S.btnSm} onClick={() => setSelectedEntry(null)}>✕</button>
            </div>
            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Usuario:</strong> {selectedEntry.user.displayName} ({selectedEntry.user.email})</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Acción:</strong> <span style={S.badge(actionColor(selectedEntry.action))}>{selectedEntry.action}</span></p>
            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Fecha:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>IP:</strong> {selectedEntry.ipAddress ?? '—'}</p>
            <p style={{ margin: '12px 0 4px', fontSize: 13, fontWeight: 600 }}>Detalle:</p>
            <pre style={S.pre}>{JSON.stringify(selectedEntry.detail, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
