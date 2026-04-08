import React, { useEffect } from 'react';
import { useAgentSOCEButton } from '../../hooks/useAgentSOCEButton';
import { useAuth } from '../../contexts/AuthContext';
import { FloatingChatShell } from '@sercop/agent-soce';
import type { AgentSOCEConfig } from '@sercop/agent-soce';

const AGENT_SOCE_API_URL = import.meta.env.VITE_AGENT_SOCE_API_URL ?? 'http://localhost:3090';

export const AgentSOCEWidget: React.FC = () => {
  const { isOpen, close } = useAgentSOCEButton();
  const { user, token } = useAuth();

  if (!isOpen || !user) return null;

  const config: AgentSOCEConfig = {
    apiBaseUrl: AGENT_SOCE_API_URL,
    token: token ?? undefined,
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
