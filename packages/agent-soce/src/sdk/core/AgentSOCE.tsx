import React, { useEffect, useState } from 'react';
import type { AgentSOCEConfig, AgentSOCETheme, HostAdapter } from '../types/index.js';
import { FloatingChatShell } from '../components/FloatingChatShell.js';

export interface AgentSOCEProps {
  config: AgentSOCEConfig;
  adapter?: HostAdapter;
  theme?: AgentSOCETheme;
  defaultOpen?: boolean;
}

export const AgentSOCE: React.FC<AgentSOCEProps> = ({
  config,
  adapter,
  theme: localTheme,
  defaultOpen,
}) => {
  const [backendTheme, setBackendTheme] = useState<AgentSOCETheme | undefined>();

  useEffect(() => {
    if (!config.apiBaseUrl) return;
    fetch(`${config.apiBaseUrl}/api/v1/agent-soce/config/theme`, {
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBackendTheme(data);
      })
      .catch(() => {});
  }, [config.apiBaseUrl, config.token]);

  return (
    <FloatingChatShell
      config={config}
      theme={localTheme}
      adapter={adapter}
      backendTheme={backendTheme}
      defaultOpen={defaultOpen}
    />
  );
};
