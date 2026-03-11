const TOKEN_KEY = 'sercop_entity_token';
const ENTITY_KEY = 'sercop_entity_id';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null): void {
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getEntityId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ENTITY_KEY);
}

export function setEntityId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(ENTITY_KEY, id);
  else localStorage.removeItem(ENTITY_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  setToken(null);
  setEntityId(null);
}
