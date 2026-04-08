import { useContext } from 'react';
import { AgentAdminContext } from '../context/AgentAdminContext.js';

export function useApi() {
  const { apiBaseUrl, token } = useContext(AgentAdminContext);

  const headers = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const url = (path: string) => `${apiBaseUrl}/api/v1/agent-soce${path}`;

  async function get<T>(path: string): Promise<T | null> {
    const r = await fetch(url(path), { headers: headers() });
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(url(path), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }

  async function put<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(url(path), { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`PUT ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }

  async function patch<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(url(path), { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }

  async function del(path: string): Promise<void> {
    const r = await fetch(url(path), { method: 'DELETE', headers: headers() });
    if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}`);
  }

  return { get, post, put, patch, del };
}
