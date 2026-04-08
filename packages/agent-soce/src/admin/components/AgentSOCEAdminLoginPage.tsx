import React, { useState } from 'react';

export interface AgentSOCEAdminLoginPageProps {
  apiBaseUrl: string;
  onLoginSuccess: (token: string, user: { email: string; displayName: string; roles: string[] }) => void;
}

export const AgentSOCEAdminLoginPage: React.FC<AgentSOCEAdminLoginPageProps> = ({
  apiBaseUrl,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/agent-soce/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; user?: { email: string; displayName: string; roles: string[] }; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error ?? 'Credenciales inválidas');
        return;
      }
      onLoginSuccess(data.token, data.user!);
    } catch {
      setError('No se pudo conectar con el servidor Agent SOCE');
    } finally {
      setLoading(false);
    }
  };

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D111C 0%, #1A202C 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    card: {
      background: '#fff',
      borderRadius: 16,
      padding: '48px 40px',
      width: '100%',
      maxWidth: 420,
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    },
    logo: {
      textAlign: 'center',
      marginBottom: 32,
    },
    logoIcon: {
      fontSize: 40,
      display: 'block',
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      color: '#1A202C',
      margin: 0,
    },
    subtitle: {
      fontSize: 13,
      color: '#718096',
      margin: '4px 0 0',
    },
    label: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: '#4A5568',
      marginBottom: 6,
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1.5px solid #E2E8F0',
      borderRadius: 8,
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.15s',
    },
    fieldWrap: {
      marginBottom: 18,
    },
    btn: {
      width: '100%',
      padding: '12px',
      background: loading ? '#A0AEC0' : '#0073E6',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: 8,
      transition: 'background 0.15s',
    },
    errorBox: {
      background: '#FFF5F5',
      border: '1px solid #FEB2B2',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#C53030',
      fontSize: 13,
      marginBottom: 16,
    },
    divider: {
      borderTop: '1px solid #EDF2F7',
      margin: '28px 0 16px',
    },
    hint: {
      fontSize: 12,
      color: '#A0AEC0',
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.logoIcon}>⚙️</span>
          <p style={S.title}>Agent SOCE</p>
          <p style={S.subtitle}>Admin Console</p>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.fieldWrap}>
            <label style={S.label}>Correo electrónico</label>
            <input
              style={S.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sercop.gob.ec"
              autoComplete="email"
              required
            />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Contraseña</label>
            <input
              style={S.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div style={S.divider} />
        <p style={S.hint}>
          Solo usuarios con rol <strong>agent_admin</strong> pueden acceder
        </p>
      </div>
    </div>
  );
};
