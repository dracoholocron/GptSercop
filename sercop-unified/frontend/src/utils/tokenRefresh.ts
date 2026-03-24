import { authService } from '../services/authService';

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the JWT token.
 * Uses a mutex so concurrent calls share the same refresh request.
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = authService.refreshToken()
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

/**
 * Decodes the JWT payload and returns the expiration time in milliseconds.
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token expires within `thresholdMs` milliseconds.
 */
export function isTokenExpiringSoon(token: string, thresholdMs = 120000): boolean {
  const exp = getTokenExpiration(token);
  return exp ? (exp - Date.now()) < thresholdMs : false;
}
