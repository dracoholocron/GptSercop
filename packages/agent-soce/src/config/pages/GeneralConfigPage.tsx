import React, { useState, useEffect } from 'react';
import { useApi } from '../../admin/hooks/useApi.js';

interface GeneralConfig {
  id?: string;
  enableDataQueries: boolean;
  enableGuidedFlows: boolean;
  enableOverlay: boolean;
  sessionTtlSeconds: number;
  rateLimitPerMinute: number;
  maxConversationLen: number;
  piiRedactionEnabled: boolean;
}

export const GeneralConfigPage: React.FC = () => {
  const { get, put } = useApi();
  const [config, setConfig] = useState<GeneralConfig>({
    enableDataQueries: true, enableGuidedFlows: true, enableOverlay: true,
    sessionTtlSeconds: 3600, rateLimitPerMinute: 30, maxConversationLen: 50,
    piiRedactionEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    get<GeneralConfig>('/config/general').then(c => { if (c) setConfig(c); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await put('/config/general', config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key: keyof GeneralConfig) => setConfig(c => ({ ...c, [key]: !c[key] }));

  const S = {
    wrap: { padding: 24, maxWidth: 600, fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)' } as React.CSSProperties,
    title: { margin: '0 0 24px', fontSize: 20, fontWeight: 700 } as React.CSSProperties,
    group: { background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', marginBottom: 16 } as React.CSSProperties,
    groupTitle: { fontSize: 13, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 12 } as React.CSSProperties,
    toggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EDF2F7' } as React.CSSProperties,
    toggleLabel: { fontSize: 14, fontWeight: 500 } as React.CSSProperties,
    toggleDesc: { fontSize: 12, color: '#718096', marginTop: 2 } as React.CSSProperties,
    switch: (on: boolean) => ({ width: 40, height: 22, background: on ? 'var(--agent-soce-primary,#0073E6)' : '#CBD5E0', borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', flexShrink: 0 } as React.CSSProperties),
    label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 } as React.CSSProperties,
    input: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
    btn: { background: 'var(--agent-soce-primary,#0073E6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14, marginTop: 20 } as React.CSSProperties,
    savedMsg: { color: '#38A169', fontSize: 13, marginLeft: 12 } as React.CSSProperties,
  };

  const toggleFeatures = [
    { key: 'enableDataQueries' as const, label: 'Consultas de Datos', desc: 'Permite que la IA consulte las bases de datos configuradas' },
    { key: 'enableGuidedFlows' as const, label: 'Flujos Guiados', desc: 'Habilita el modo de guía paso a paso para usuarios' },
    { key: 'enableOverlay' as const, label: 'Overlay de Resaltado', desc: 'Permite resaltar campos en la pantalla durante guías' },
    { key: 'piiRedactionEnabled' as const, label: 'Redacción de PII', desc: 'Oculta automáticamente cédulas, RUC y teléfonos en los mensajes' },
  ];

  return (
    <div style={S.wrap}>
      <h2 style={S.title}>Configuración General</h2>

      <div style={S.group}>
        <p style={S.groupTitle}>Características</p>
        {toggleFeatures.map(({ key, label, desc }) => (
          <div key={key} style={S.toggle}>
            <div><div style={S.toggleLabel}>{label}</div><div style={S.toggleDesc}>{desc}</div></div>
            <button style={S.switch(config[key] as boolean)} onClick={() => toggle(key)} />
          </div>
        ))}
      </div>

      <div style={S.group}>
        <p style={S.groupTitle}>Límites</p>
        <label style={S.label}>Tiempo de sesión (segundos)</label>
        <input style={S.input} type="number" value={config.sessionTtlSeconds} onChange={e => setConfig(c => ({ ...c, sessionTtlSeconds: Number(e.target.value) }))} />
        <label style={S.label}>Rate limit (mensajes/minuto)</label>
        <input style={S.input} type="number" value={config.rateLimitPerMinute} onChange={e => setConfig(c => ({ ...c, rateLimitPerMinute: Number(e.target.value) }))} />
        <label style={S.label}>Máximo de mensajes por conversación</label>
        <input style={S.input} type="number" value={config.maxConversationLen} onChange={e => setConfig(c => ({ ...c, maxConversationLen: Number(e.target.value) }))} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button style={S.btn} onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        {saved && <span style={S.savedMsg}>✓ Guardado</span>}
      </div>
    </div>
  );
};
