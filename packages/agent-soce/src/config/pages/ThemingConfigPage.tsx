import * as React from 'react';

export interface ThemingConfigPageProps {
  baseUrl: string;
  token: string;
}

type ThemeResponse = {
  id?: string;
  name?: string;
  isActive?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  bgColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  chatBubbleUser?: string;
  chatBubbleAgent?: string;
  fontFamily?: string;
  borderRadius?: string;
  logoUrl?: string | null;
  iconUrl?: string | null;
  buttonLabel?: string;
  customCss?: string | null;
};

const shell: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  color: '#0f172a',
  maxWidth: 1080,
  margin: '0 auto',
  padding: 24,
};

const title: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: '0 0 20px' };

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
  gap: 24,
  alignItems: 'start',
};

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

const colorRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #ea580c, #db2777)',
  color: '#fff',
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

function joinUrl(root: string, path: string): string {
  const r = root.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${r}${p}`;
}

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function parseRadiusPx(r: string | undefined): number {
  if (!r) return 12;
  const m = /^(\d+(?:\.\d+)?)px$/i.exec(r.trim());
  if (m) return Math.min(32, Math.max(0, Number(m[1])));
  const n = Number(r);
  return Number.isFinite(n) ? Math.min(32, Math.max(0, n)) : 12;
}

function ColorField({
  id,
  labelText,
  value,
  onChange,
}: {
  id: string;
  labelText: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div>
      <label style={label} htmlFor={id}>
        {labelText}
      </label>
      <div style={colorRow}>
        <input
          id={id}
          type="color"
          value={/^#([0-9a-f]{6})$/i.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 44, height: 44, padding: 0, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}
        />
        <input style={{ ...input, flex: 1 }} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function ThemingConfigPage({ baseUrl, token }: ThemingConfigPageProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [themeId, setThemeId] = React.useState<string | null>(null);
  const [themeName, setThemeName] = React.useState('Default');

  const [primaryColor, setPrimaryColor] = React.useState('#0073E6');
  const [secondaryColor, setSecondaryColor] = React.useState('#FFB800');
  const [accentColor, setAccentColor] = React.useState('#10B981');
  const [bgColor, setBgColor] = React.useState('#FFFFFF');
  const [bgColorDark, setBgColorDark] = React.useState('#0D111C');
  const [textColor, setTextColor] = React.useState('#1A202C');
  const [textColorDark, setTextColorDark] = React.useState('#E2E8F0');
  const [chatBubbleUser, setChatBubbleUser] = React.useState('#0073E6');
  const [chatBubbleAgent, setChatBubbleAgent] = React.useState('#F7FAFC');
  const [fontFamily, setFontFamily] = React.useState('Inter, system-ui, sans-serif');
  const [radiusPx, setRadiusPx] = React.useState(12);
  const [logoUrl, setLogoUrl] = React.useState('');
  const [iconUrl, setIconUrl] = React.useState('');
  const [buttonLabel, setButtonLabel] = React.useState('Agent SOCE');
  const [customCss, setCustomCss] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(joinUrl(baseUrl, '/config/theme'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const data = (await res.json()) as ThemeResponse;
      if (data.id) setThemeId(data.id);
      if (data.name) setThemeName(data.name);
      if (data.primaryColor) setPrimaryColor(data.primaryColor);
      if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
      if (data.accentColor) setAccentColor(data.accentColor);
      if (data.bgColor) setBgColor(data.bgColor);
      if (data.bgColorDark) setBgColorDark(data.bgColorDark);
      if (data.textColor) setTextColor(data.textColor);
      if (data.textColorDark) setTextColorDark(data.textColorDark);
      if (data.chatBubbleUser) setChatBubbleUser(data.chatBubbleUser);
      if (data.chatBubbleAgent) setChatBubbleAgent(data.chatBubbleAgent);
      if (data.fontFamily) setFontFamily(data.fontFamily);
      setRadiusPx(parseRadiusPx(data.borderRadius));
      setLogoUrl(data.logoUrl ?? '');
      setIconUrl(data.iconUrl ?? '');
      if (data.buttonLabel) setButtonLabel(data.buttonLabel);
      setCustomCss(data.customCss ?? '');
      if (data.isActive != null) setIsActive(data.isActive);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load theme');
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
    const body: Record<string, unknown> = {
      name: themeName.trim() || 'Default',
      isActive,
      primaryColor,
      secondaryColor,
      accentColor,
      bgColor,
      bgColorDark,
      textColor,
      textColorDark,
      chatBubbleUser,
      chatBubbleAgent,
      fontFamily: fontFamily.trim(),
      borderRadius: `${radiusPx}px`,
      logoUrl: logoUrl.trim() || null,
      iconUrl: iconUrl.trim() || null,
      buttonLabel: buttonLabel.trim() || 'Agent SOCE',
      customCss: customCss.trim() || null,
    };
    try {
      if (themeId) {
        const res = await fetch(joinUrl(baseUrl, `/config/theme/${themeId}`), {
          method: 'PUT',
          headers: headers(token),
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      } else {
        const res = await fetch(joinUrl(baseUrl, '/config/theme'), {
          method: 'POST',
          headers: headers(token),
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
        const created = (await res.json()) as { id?: string };
        if (created.id) setThemeId(created.id);
      }
      setInfo('Theme saved.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const borderRadius = `${radiusPx}px`;
  const previewShell: React.CSSProperties = {
    borderRadius,
    border: `1px solid ${accentColor}33`,
    overflow: 'hidden',
    background: bgColor,
    color: textColor,
    fontFamily,
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={shell}>
      <h1 style={title}>Theming</h1>
      {error ? <div style={errorBox}>{error}</div> : null}
      {info ? (
        <div style={{ ...errorBox, background: '#ecfdf5', color: '#047857', marginBottom: 16 }}>{info}</div>
      ) : null}

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={layout}>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Tokens</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <ColorField id="th-primary" labelText="Primary" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField id="th-secondary" labelText="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
              <ColorField id="th-accent" labelText="Accent" value={accentColor} onChange={setAccentColor} />
              <ColorField id="th-bg" labelText="Background" value={bgColor} onChange={setBgColor} />
              <ColorField id="th-bg-d" labelText="Background (dark)" value={bgColorDark} onChange={setBgColorDark} />
              <ColorField id="th-text" labelText="Text" value={textColor} onChange={setTextColor} />
              <ColorField id="th-text-d" labelText="Text (dark)" value={textColorDark} onChange={setTextColorDark} />
              <ColorField id="th-bu" labelText="Chat bubble (user)" value={chatBubbleUser} onChange={setChatBubbleUser} />
              <ColorField
                id="th-ba"
                labelText="Chat bubble (agent)"
                value={chatBubbleAgent}
                onChange={setChatBubbleAgent}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-font">
                Font family
              </label>
              <input
                id="th-font"
                style={input}
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-radius">
                Border radius: {radiusPx}px
              </label>
              <input
                id="th-radius"
                type="range"
                min={0}
                max={32}
                value={radiusPx}
                style={{ width: '100%' }}
                onChange={(e) => setRadiusPx(Number(e.target.value))}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-label">
                Button label
              </label>
              <input
                id="th-label"
                style={input}
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-logo">
                Logo URL
              </label>
              <input id="th-logo" style={input} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-icon">
                Icon URL
              </label>
              <input id="th-icon" style={input} value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={label} htmlFor="th-css">
                Custom CSS
              </label>
              <textarea
                id="th-css"
                style={{ ...input, minHeight: 100, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 12,
              }}
            >
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active theme
            </label>
            <button
              type="button"
              style={{ ...btnPrimary, marginTop: 20 }}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save theme'}
            </button>
          </div>

          <div style={{ position: 'sticky', top: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', margin: '0 0 10px' }}>Live preview</h2>
            <div style={previewShell}>
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${textColor}18`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: `linear-gradient(90deg, ${primaryColor}22, transparent)`,
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
                ) : null}
                <span style={{ fontWeight: 700, flex: 1 }}>{buttonLabel}</span>
                <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: secondaryColor, color: '#111' }}>
                  Beta
                </span>
              </div>
              <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius,
                    background: chatBubbleUser,
                    color: '#fff',
                    fontSize: 13,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  Hola, ¿puedes ayudarme con un pliego?
                </div>
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '90%',
                    padding: '10px 14px',
                    borderRadius,
                    background: chatBubbleAgent,
                    color: textColor,
                    fontSize: 13,
                    border: `1px solid ${textColor}14`,
                  }}
                >
                  Claro. Indica el número de proceso o pega un fragmento y te guío paso a paso.
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    readOnly
                    placeholder="Escribe un mensaje…"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius,
                      border: `1px solid ${textColor}22`,
                      fontSize: 13,
                      background: bgColor,
                      color: textColor,
                    }}
                  />
                  <span
                    style={{
                      padding: '10px 14px',
                      borderRadius,
                      background: primaryColor,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Enviar
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
              Dark tokens are stored for host apps; this panel uses light background for clarity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemingConfigPage;
