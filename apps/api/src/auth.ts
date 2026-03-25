/**
 * JWT auth (Fase 2): emisión y verificación de tokens; roles: public | supplier | entity | admin.
 * En producción reemplazar por IdP OIDC (Keycloak, Auth0, etc.).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const ALG = 'HS256';
const TTL_SEC = 60 * 60 * 24; // 24h

export type Role = 'public' | 'supplier' | 'entity' | 'admin';

export interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

export function isAuthDisabled(): boolean {
  const raw = process.env.AUTH_DISABLED?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function hasJwtSecret(): boolean {
  const s = process.env.JWT_SECRET;
  return !!s && s.length >= 16;
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET must be set and at least 16 chars');
  return s;
}

function b64UrlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function b64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

function signPayload(payload: object): string {
  const secret = getSecret();
  const header = { alg: ALG, typ: 'JWT' };
  const headerB64 = b64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = b64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = createHmac('sha256', secret).update(data).digest();
  return `${data}.${b64UrlEncode(sig)}`;
}

function verifyToken(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [headerB64, payloadB64, sigB64] = parts;
  const secret = getSecret();
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', secret).update(data).digest();
  const actualSig = b64UrlDecode(sigB64);
  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    throw new Error('invalid signature');
  }
  const payload = JSON.parse(b64UrlDecode(payloadB64).toString('utf8')) as JwtPayload;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) throw new Error('token expired');
  return payload;
}

/** Emite un JWT para el usuario (login). */
export function sign(payload: { sub: string; role: Role }): string {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    sub: payload.sub,
    role: payload.role,
    iat: now,
    exp: now + TTL_SEC,
  });
}

/** Verifica el token y devuelve el payload. */
export function verify(token: string): JwtPayload {
  return verifyToken(token);
}

/** Extrae Bearer token del header Authorization. */
export function bearerFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}
