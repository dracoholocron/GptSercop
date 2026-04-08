import React, { useEffect, useState, useRef } from 'react';
import { useAgentSOCEButton } from '../../hooks/useAgentSOCEButton';
import { useAuth } from '../../contexts/AuthContext';
import { FloatingChatShell } from '@sercop/agent-soce';
import type { AgentSOCEConfig } from '@sercop/agent-soce';

const AGENT_SOCE_API_URL = import.meta.env.VITE_AGENT_SOCE_API_URL ?? 'http://localhost:3090';
const WIDGET_KEY = import.meta.env.VITE_AGENT_SOCE_WIDGET_KEY ?? 'agent-soce-widget-dev-key';
const SESSION_STORAGE_KEY = 'agent_soce_session_token';

export const AgentSOCEWidget: React.FC = () => {
  const { isOpen } = useAgentSOCEButton();
  const { user } = useAuth();
  const [agentToken, setAgentToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(SESSION_STORAGE_KEY); } catch { return null; }
  });
  const fetchedRef = useRef(false);

  // Exchange host app session for an Agent SOCE chat token once per browser session
  useEffect(() => {
    if (!user || agentToken || fetchedRef.current) return;
    fetchedRef.current = true;

    const displayName = user.name ?? user.username ?? user.email;

    fetch(`${AGENT_SOCE_API_URL}/api/v1/agent-soce/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, displayName, widgetKey: WIDGET_KEY }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { token?: string } | null) => {
        if (data?.token) {
          setAgentToken(data.token);
          try { sessionStorage.setItem(SESSION_STORAGE_KEY, data.token); } catch {}
        }
      })
      .catch(() => {});
  }, [user, agentToken]);

  // Clear session token on user change (logout/switch)
  useEffect(() => {
    if (!user) {
      setAgentToken(null);
      fetchedRef.current = false;
      try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const config: AgentSOCEConfig = {
    apiBaseUrl: AGENT_SOCE_API_URL,
    token: agentToken ?? undefined,
  };

  return (
    <FloatingChatShell
      config={config}
      defaultOpen={true}
      theme={{
        buttonLabel: 'Agent SOCE',
        primaryColor: '#0073E6',
      }}
    />
  );
};
