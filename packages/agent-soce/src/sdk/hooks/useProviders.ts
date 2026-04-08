import { useState, useEffect } from 'react';

export interface LLMProviderInfo {
  id: string;
  name: string;
  type: string;
  model: string;
  isDefault: boolean;
}

export function useProviders(baseUrl: string, token: string) {
  const [providers, setProviders] = useState<LLMProviderInfo[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${baseUrl}/api/v1/agent-soce/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data: LLMProviderInfo[]) => setProviders(data))
      .catch(() => {});
  }, [baseUrl, token]);

  return providers;
}
