import { createContext } from 'react';

export interface AgentAdminContextValue {
  apiBaseUrl: string;
  token?: string;
}

export const AgentAdminContext = createContext<AgentAdminContextValue>({
  apiBaseUrl: 'http://localhost:3090',
});
