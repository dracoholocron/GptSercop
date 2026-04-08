import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AgentAdminContext } from '../context/AgentAdminContext.js';
import { RolesPage } from '../pages/RolesPage.js';
import { UsersPage } from '../pages/UsersPage.js';
import { PermissionsPage } from '../pages/PermissionsPage.js';
import { DataSourcesPage } from '../pages/DataSourcesPage.js';
import { AuditLogPage } from '../pages/AuditLogPage.js';
import { TrainingPage } from '../pages/TrainingPage.js';
import { LLMConfigPage } from '../../config/pages/LLMConfigPage.js';
import { RAGConfigPage } from '../../config/pages/RAGConfigPage.js';
import { GraphDBConfigPage } from '../../config/pages/GraphDBConfigPage.js';
import { ThemingConfigPage } from '../../config/pages/ThemingConfigPage.js';
import { GeneralConfigPage } from '../../config/pages/GeneralConfigPage.js';
import { AgentSOCEAdminLoginPage } from './AgentSOCEAdminLoginPage.js';

// Wrapper components that pull apiBaseUrl/token from context and pass as props
const LLMConfigWrapper: React.FC = () => { const { apiBaseUrl, token } = useContext(AgentAdminContext); return <LLMConfigPage baseUrl={apiBaseUrl} token={token ?? ''} />; };
const RAGConfigWrapper: React.FC = () => { const { apiBaseUrl, token } = useContext(AgentAdminContext); return <RAGConfigPage baseUrl={apiBaseUrl} token={token ?? ''} />; };
const GraphDBConfigWrapper: React.FC = () => { const { apiBaseUrl, token } = useContext(AgentAdminContext); return <GraphDBConfigPage baseUrl={apiBaseUrl} token={token ?? ''} />; };
const ThemingConfigWrapper: React.FC = () => { const { apiBaseUrl, token } = useContext(AgentAdminContext); return <ThemingConfigPage baseUrl={apiBaseUrl} token={token ?? ''} />; };

type View =
  | 'roles' | 'users' | 'permissions' | 'data-sources' | 'audit' | 'training'
  | 'llm' | 'rag' | 'graph' | 'theming' | 'general';

interface NavItem { key: View; label: string; icon: string; section: 'admin' | 'config' }

const NAV_ITEMS: NavItem[] = [
  { key: 'roles', label: 'Roles', icon: '🛡️', section: 'admin' },
  { key: 'users', label: 'Usuarios', icon: '👥', section: 'admin' },
  { key: 'permissions', label: 'Permisos', icon: '🔐', section: 'admin' },
  { key: 'data-sources', label: 'Data Sources', icon: '🗄️', section: 'admin' },
  { key: 'audit', label: 'Auditoría', icon: '📋', section: 'admin' },
  { key: 'training', label: 'Entrenamiento', icon: '🎓', section: 'admin' },
  { key: 'llm', label: 'Modelos LLM', icon: '🤖', section: 'config' },
  { key: 'rag', label: 'RAG Config', icon: '🔍', section: 'config' },
  { key: 'graph', label: 'Graph DB', icon: '🕸️', section: 'config' },
  { key: 'theming', label: 'Apariencia', icon: '🎨', section: 'config' },
  { key: 'general', label: 'General', icon: '⚙️', section: 'config' },
];

const PAGE_COMPONENTS: Record<View, React.ComponentType> = {
  roles: RolesPage, users: UsersPage, permissions: PermissionsPage,
  'data-sources': DataSourcesPage, audit: AuditLogPage, training: TrainingPage,
  llm: LLMConfigWrapper, rag: RAGConfigWrapper, graph: GraphDBConfigWrapper,
  theming: ThemingConfigWrapper, general: GeneralConfigPage,
};

const STORAGE_KEY = 'agent_soce_admin_token';

export interface AgentSOCEAdminAppProps {
  apiBaseUrl: string;
  /** Optional pre-existing token (e.g. from host app SSO). If omitted, the
   *  built-in login form is shown when no persisted token is found. */
  token?: string;
  initialView?: View;
}

export const AgentSOCEAdminApp: React.FC<AgentSOCEAdminAppProps> = ({
  apiBaseUrl,
  token: externalToken,
  initialView = 'roles',
}) => {
  // Resolve token: external prop > sessionStorage > null (→ show login)
  const getStoredToken = () => {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
  };

  const [adminToken, setAdminToken] = useState<string | null>(
    externalToken ?? getStoredToken(),
  );
  const [adminUser, setAdminUser] = useState<{ email: string; displayName: string } | null>(null);

  // Keep token in sessionStorage (survives page refresh, cleared on tab close)
  useEffect(() => {
    if (adminToken) {
      try { sessionStorage.setItem(STORAGE_KEY, adminToken); } catch {}
    }
  }, [adminToken]);

  const handleLoginSuccess = useCallback(
    (token: string, user: { email: string; displayName: string; roles: string[] }) => {
      setAdminToken(token);
      setAdminUser({ email: user.email, displayName: user.displayName });
    },
    [],
  );

  const handleLogout = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  // Show login page if no token available
  if (!adminToken) {
    return <AgentSOCEAdminLoginPage apiBaseUrl={apiBaseUrl} onLoginSuccess={handleLoginSuccess} />;
  }

  const token = adminToken;

  const [active, setActive] = useState<View>(initialView);
  const ActivePage = PAGE_COMPONENTS[active];

  const adminItems = NAV_ITEMS.filter(i => i.section === 'admin');
  const configItems = NAV_ITEMS.filter(i => i.section === 'config');

  const S = {
    shell: { display: 'flex', height: '100vh', fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)', background: '#F7FAFC' } as React.CSSProperties,
    sidebar: { width: 220, background: '#1A202C', color: '#E2E8F0', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
    logo: { padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
    sectionLabel: { fontSize: 10, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '16px 16px 6px' },
    navItem: (active: boolean) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer',
      fontSize: 14, borderRadius: 6, margin: '1px 8px',
      background: active ? 'rgba(0,115,230,0.25)' : 'transparent',
      color: active ? '#63B3ED' : '#CBD5E0',
      fontWeight: active ? 600 : 400,
      transition: 'background 0.15s, color 0.15s',
    } as React.CSSProperties),
    main: { flex: 1, overflowY: 'auto' as const },
    topbar: { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
    topbarTitle: { fontSize: 16, fontWeight: 600 } as React.CSSProperties,
    content: { flex: 1, overflowY: 'auto' as const },
  };

  const currentItem = NAV_ITEMS.find(i => i.key === active)!;

  return (
    <AgentAdminContext.Provider value={{ apiBaseUrl, token }}>
      <div style={S.shell}>
        <div style={S.sidebar}>
          <div style={S.logo}>
            <span>⚙️</span>
            <div><div>Agent SOCE</div><div style={{ fontSize: 11, color: '#718096', fontWeight: 400 }}>Admin Console</div></div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            <p style={S.sectionLabel}>Administración</p>
            {adminItems.map(item => (
              <div key={item.key} style={S.navItem(active === item.key)} onClick={() => setActive(item.key)}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}

            <p style={S.sectionLabel}>Configuración</p>
            {configItems.map(item => (
              <div key={item.key} style={S.navItem(active === item.key)} onClick={() => setActive(item.key)}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>

          {/* User info + logout */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {adminUser && (
              <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminUser.displayName}
              </div>
            )}
            <div
              onClick={handleLogout}
              style={{ fontSize: 13, color: '#FC8181', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>🚪</span> Cerrar sesión
            </div>
          </div>
        </div>

        <div style={S.main}>
          <div style={S.topbar}>
            <span>{currentItem.icon}</span>
            <span style={S.topbarTitle}>{currentItem.label}</span>
          </div>
          <div style={S.content}>
            <ActivePage />
          </div>
        </div>
      </div>
    </AgentAdminContext.Provider>
  );
};
