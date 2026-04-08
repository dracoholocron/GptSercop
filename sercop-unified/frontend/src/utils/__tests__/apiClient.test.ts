/**
 * U3 – apiClient dual-backend routing unit test
 * Validates that /v1/ endpoints route to NODE_API_BASE_URL and
 * /api/ endpoints route through the Java proxy path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────
// Mock environment before module import
// ──────────────────────────────────────────────────────────────
vi.mock('../../config/api.config', () => ({
  API_BASE_URL: 'http://java-api:8080/api',
  NODE_API_BASE_URL: 'http://node-api:3080',
  TOKEN_STORAGE_KEY: 'globalcmx_token',
  USER_STORAGE_KEY: 'globalcmx_user',
}));

vi.mock('../../utils/tokenRefresh', () => ({
  attemptTokenRefresh: vi.fn().mockResolvedValue(false),
}));

// Capture fetch calls
const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
  new Response('{}', { status: 200 })
);

import { get, post, put, patch, del } from '../apiClient';

describe('apiClient – dual-backend routing', () => {
  beforeEach(() => {
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }));
    localStorage.clear();
  });

  // ── Route resolution ──────────────────────────────────────

  it('U3-01: /v1/ endpoint routes to NODE_API_BASE_URL', async () => {
    await get('/v1/gptsercop/metrics');
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('node-api:3080');
    expect(calledUrl).toContain('/v1/gptsercop/metrics');
  });

  it('U3-02: /api/ endpoint does NOT route to node-api (uses proxy path)', async () => {
    await get('/api/compras-publicas/tenders');
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('node-api:3080');
  });

  it('U3-03: absolute http URL is used as-is', async () => {
    await get('http://external.example.com/data');
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toBe('http://external.example.com/data');
  });

  // ── Method helpers ────────────────────────────────────────

  it('U3-04: get() sends GET method', async () => {
    await get('/v1/tenders');
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('GET');
  });

  it('U3-05: post() sends POST method with serialised body', async () => {
    await post('/v1/tenders', { title: 'Test' });
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ title: 'Test' }));
  });

  it('U3-06: put() sends PUT method', async () => {
    await put('/v1/tenders/1', { title: 'Updated' });
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PUT');
  });

  it('U3-07: patch() sends PATCH method (not POST)', async () => {
    await patch('/v1/tenders/1', { status: 'active' });
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PATCH');
    expect(options.method).not.toBe('POST');
  });

  it('U3-08: del() sends DELETE method', async () => {
    await del('/v1/tenders/1');
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('DELETE');
  });

  // ── Auth header injection ─────────────────────────────────

  it('U3-09: Bearer token injected when token present in localStorage', async () => {
    localStorage.setItem('globalcmx_token', 'my-jwt-token');
    await get('/v1/tenders');
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('U3-10: No Authorization header when localStorage is empty', async () => {
    await get('/v1/tenders');
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  // ── Content-Type ──────────────────────────────────────────

  it('U3-11: Content-Type application/json is always set', async () => {
    await get('/v1/tenders');
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  // ── /v1/ URL construction edge cases ─────────────────────

  it('U3-12: /v1/ path without leading /api is prefixed with /api', async () => {
    await get('/v1/cpc/tree');
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/node-api:3080\/api\/v1\/cpc\/tree/);
  });
});
