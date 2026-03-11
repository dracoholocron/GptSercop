const TOKEN_KEY = 'sercop_supplier_token';
const PROVIDER_KEY = 'sercop_supplier_provider_id';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null): void {
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getProviderId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PROVIDER_KEY);
}

export function setProviderId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(PROVIDER_KEY, id);
  else localStorage.removeItem(PROVIDER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  setToken(null);
  setProviderId(null);
}
