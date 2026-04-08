import * as React from 'react';

export interface GraphDBConfigPageProps {
  baseUrl: string;
  token: string;
}

type GraphResponse = {
  id?: string;
  graphName?: string;
  syncEnabled?: boolean;
  syncCron?: string;
  createdAt?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  lastError?: string;
};

const shell: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  color: '#0f172a',
  maxWidth: 640,
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
  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
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

const statusOk: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: '#f5f3ff',
  border: '1px solid #ddd6fe',
  fontSize: 14,
};

function joinUrl(root: string, path: string): string {
  const r = root.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${r}${p}`;
}

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function GraphDBConfigPage({ baseUrl, token }: GraphDBConfigPageProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [raw, setRaw] = React.useState<GraphResponse | null>(null);

  const [graphName, setGraphName] = React.useState('sercop_graph');
  const [syncEnabled, setSyncEnabled] = React.useState(true);
  const [syncCron, setSyncCron] = React.useState('0 */6 * * *');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/graph'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const data = (await res.json()) as GraphResponse;
      setRaw(data);
      if (data.graphName != null) setGraphName(data.graphName);
      if (data.syncEnabled != null) setSyncEnabled(data.syncEnabled);
      if (data.syncCron != null) setSyncCron(data.syncCron);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load graph config');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/graph'), {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify({ graphName: graphName.trim(), syncEnabled, syncCron: syncCron.trim() }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      setInfo('Graph configuration saved.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function syncNow(): Promise<void> {
    setSyncing(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/graph/sync'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; status?: string };
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      setInfo(data.message ?? data.status ?? 'Sync queued.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync request failed');
    } finally {
      setSyncing(false);
    }
  }

  const displayStatus = raw?.syncStatus ?? (syncEnabled ? 'Scheduled sync enabled' : 'Sync disabled');
  const lastSync = raw?.lastSyncAt ?? '—';
  const lastErr = raw?.lastError;

  return (
    <div style={shell}>
      <h1 style={title}>Graph database</h1>
      {error ? <div style={errorBox}>{error}</div> : null}
      {info ? (
        <div style={{ ...errorBox, background: '#ecfdf5', color: '#047857', marginBottom: 16 }}>{info}</div>
      ) : null}

      <div style={{ ...card, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Status</h2>
        <div style={statusOk}>
          <div>
            <strong>State:</strong> {displayStatus}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Last sync:</strong> {lastSync}
          </div>
          {lastErr ? (
            <div style={{ marginTop: 8, color: '#b91c1c' }}>
              <strong>Last error:</strong> {lastErr}
            </div>
          ) : null}
          {raw?.createdAt ? (
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              Config created: {raw.createdAt}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={card}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={label} htmlFor="graph-name">
                Graph name
              </label>
              <input
                id="graph-name"
                style={input}
                value={graphName}
                onChange={(e) => setGraphName(e.target.value)}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={syncEnabled} onChange={(e) => setSyncEnabled(e.target.checked)} />
              Sync enabled
            </label>
            <div>
              <label style={label} htmlFor="graph-cron">
                Sync cron
              </label>
              <input
                id="graph-cron"
                style={input}
                placeholder="0 */6 * * *"
                value={syncCron}
                onChange={(e) => setSyncCron(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
            <button type="button" style={btnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" style={btnGhost} disabled={syncing} onClick={() => void syncNow()}>
              {syncing ? 'Starting…' : 'Sync now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphDBConfigPage;
