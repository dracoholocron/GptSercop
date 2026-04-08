import * as React from 'react';

export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface LLMProviderRow {
  id: string;
  name: string;
  type: string;
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
  maxTokens: number;
  temperature: number;
  metadata?: unknown;
  createdAt?: string;
}

export interface LLMConfigPageProps {
  baseUrl: string;
  token: string;
}

const shell: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  color: '#0f172a',
  maxWidth: 1100,
  margin: '0 auto',
  padding: 24,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 16,
};

const title: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: 0 };

const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
};

const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  fontWeight: 500,
  cursor: 'pointer',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};

const card: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 18,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const badge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '4px 8px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#4338ca',
};

const statusPill = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 999,
  background: active ? '#dcfce7' : '#f1f5f9',
  color: active ? '#166534' : '#64748b',
});

const formBox: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
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

const errorBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: 14,
  marginBottom: 16,
};

const loadingBox: React.CSSProperties = { padding: 40, textAlign: 'center', color: '#64748b' };

function joinUrl(root: string, path: string): string {
  const r = root.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${r}${p}`;
}

function headers(token: string, json = true): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

const emptyForm = {
  name: '',
  type: 'openai' as LLMProviderType,
  apiKey: '',
  baseUrl: '',
  model: '',
  temperature: 0.3,
  maxTokens: 4096,
  isDefault: false,
  isActive: true,
};

export function LLMConfigPage({ baseUrl, token }: LLMConfigPageProps): React.ReactElement {
  const [providers, setProviders] = React.useState<LLMProviderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testMsg, setTestMsg] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<'idle' | 'add' | 'edit'>('idle');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ ...emptyForm });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/llm-providers'), { headers: headers(token, false) });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const data = (await res.json()) as LLMProviderRow[];
      setProviders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openAdd(): void {
    setMode('add');
    setEditId(null);
    setForm({ ...emptyForm });
    setTestMsg(null);
  }

  function openEdit(p: LLMProviderRow): void {
    setMode('edit');
    setEditId(p.id);
    setForm({
      name: p.name,
      type: (['openai', 'anthropic', 'google', 'ollama'].includes(p.type) ? p.type : 'openai') as LLMProviderType,
      apiKey: '',
      baseUrl: p.baseUrl ?? '',
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      isDefault: p.isDefault,
      isActive: p.isActive,
    });
    setTestMsg(null);
  }

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        type: form.type,
        model: form.model.trim(),
        baseUrl: form.baseUrl.trim() || undefined,
        maxTokens: form.maxTokens,
        temperature: form.temperature,
        isDefault: form.isDefault,
        isActive: form.isActive,
      };
      if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();

      if (mode === 'add') {
        const res = await fetch(joinUrl(baseUrl, '/config/llm-providers'), {
          method: 'POST',
          headers: headers(token),
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      } else if (mode === 'edit' && editId) {
        const putBody = { ...body };
        if (!form.apiKey.trim()) delete putBody.apiKey;
        const res = await fetch(joinUrl(baseUrl, `/config/llm-providers/${editId}`), {
          method: 'PUT',
          headers: headers(token),
          body: JSON.stringify(putBody),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      }
      setMode('idle');
      setEditId(null);
      setForm({ ...emptyForm });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(id: string): Promise<void> {
    setTestingId(id);
    setTestMsg(null);
    try {
      const res = await fetch(joinUrl(baseUrl, `/config/llm-providers/${id}/test`), {
        method: 'POST',
        headers: headers(token, false),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; provider?: string };
      if (!res.ok) setTestMsg(data.error ?? res.statusText);
      else setTestMsg(data.ok ? `OK — ${data.provider ?? id}` : (data.error ?? 'Check failed'));
    } catch (e) {
      setTestMsg(e instanceof Error ? e.message : 'Test request failed');
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div style={shell}>
      <div style={headerRow}>
        <h1 style={title}>LLM providers</h1>
        <button type="button" style={btnPrimary} onClick={openAdd}>
          Add provider
        </button>
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}
      {testMsg ? (
        <div
          style={{
            ...errorBox,
            background: testMsg.startsWith('OK') ? '#ecfdf5' : errorBox.background,
            color: testMsg.startsWith('OK') ? '#047857' : errorBox.color,
            marginBottom: 16,
          }}
        >
          {testMsg}
        </div>
      ) : null}

      {loading ? (
        <div style={loadingBox}>Loading providers…</div>
      ) : (
        <div style={grid}>
          {providers.map((p) => (
            <div key={p.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{p.type}</div>
                </div>
                {p.isDefault ? <span style={badge}>Default</span> : null}
              </div>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Model </span>
                <span style={{ fontWeight: 600 }}>{p.model}</span>
              </div>
              <div>
                <span style={statusPill(p.isActive)}>{p.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                <button type="button" style={btnGhost} onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, opacity: testingId === p.id ? 0.6 : 1 }}
                  disabled={testingId !== null}
                  onClick={() => void testProvider(p.id)}
                >
                  {testingId === p.id ? 'Testing…' : 'Test'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode !== 'idle' ? (
        <div style={formBox}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>{mode === 'add' ? 'New provider' : 'Edit provider'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={label} htmlFor="llm-name">
                Name
              </label>
              <input
                id="llm-name"
                style={input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={label} htmlFor="llm-type">
                Type
              </label>
              <select
                id="llm-type"
                style={input}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LLMProviderType }))}
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="google">google</option>
                <option value="ollama">ollama</option>
              </select>
            </div>
            <div>
              <label style={label} htmlFor="llm-model">
                Model
              </label>
              <input
                id="llm-model"
                style={input}
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label} htmlFor="llm-key">
                API key
              </label>
              <input
                id="llm-key"
                type="password"
                autoComplete="off"
                style={input}
                placeholder={mode === 'edit' ? 'Leave blank to keep existing' : ''}
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label} htmlFor="llm-base">
                Base URL
              </label>
              <input
                id="llm-base"
                style={input}
                placeholder="Optional"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>
            <div>
              <label style={label} htmlFor="llm-temp">
                Temperature: {form.temperature.toFixed(2)}
              </label>
              <input
                id="llm-temp"
                type="range"
                min={0}
                max={2}
                step={0.05}
                style={{ width: '100%' }}
                value={form.temperature}
                onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={label} htmlFor="llm-max">
                Max tokens
              </label>
              <input
                id="llm-max"
                type="number"
                style={input}
                min={1}
                value={form.maxTokens}
                onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
                Default provider
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" style={btnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              style={btnGhost}
              disabled={saving}
              onClick={() => {
                setMode('idle');
                setEditId(null);
                setForm({ ...emptyForm });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LLMConfigPage;
