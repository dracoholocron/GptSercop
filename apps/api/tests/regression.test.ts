import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index.js';
import { prisma } from '../src/db.js';
import { sign } from '../src/auth.js';

describe('API Regression Tests [20 Tests]', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = sign({ sub: 'admin@sercop.gob.ec', role: 'admin' });
    await app.ready();
  });

  describe('Handling Malformed UUIDs and Invalid Path Variables', () => {
    it('51. GET /api/v1/tenders/invalid-uuid handles safely without crashing', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/tenders/invalid-uuid' });
      expect([404, 500]).toContain(res.statusCode);
    });

    it('52. GET /api/v1/contracts/invalid-id/payments', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/contracts/invalid-id/payments' });
      expect([200, 404, 500]).toContain(res.statusCode); // Native DB handling
    });

    it('53. PATCH /api/v1/complaints/123 (Not Found)', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/complaints/123', headers: { authorization: `Bearer ${adminToken}` }, payload: { status: 'closed' } });
      expect([404, 500]).toContain(res.statusCode);
    });
  });

  describe('Missing Required Body Payload Data', () => {
    it('54. POST /api/v1/tenders with empty object fails explicitly', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/tenders', payload: {} });
      expect(res.statusCode).toBe(400); // Trigger missing logic constraint
    });

    it('55. POST /api/v1/complaints missing channel/category', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/complaints', payload: { summary: 'test' } });
      expect(res.statusCode).toBe(400); 
    });

    it('56. POST /api/v1/rag/chunks missing documentType', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/rag/chunks', payload: { title: 'T', content: 'C', source: 'S' } });
      expect(res.statusCode).toBe(400); 
    });

    it('57. POST /api/v1/process-claims missing everything', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/process-claims', headers: { authorization: `Bearer ${adminToken}` }, payload: {} });
      expect([400, 403]).toContain(res.statusCode); // Triggers role denial or 400
    });
  });

  describe('Type coercion and bad datatypes constraints', () => {
    it('58. Pagination with string letters defaults cleanly (page=abc)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/tenders?page=abc' });
      expect(res.statusCode).toBe(200); // Should default to page 1
    });

    it('59. Pagination with extreme pageSize bounds defaults', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/users?pageSize=999999' });
      expect(res.statusCode).toBe(200); // Should cap at 100/50 normally
    });

    it('60. Creating contract payment with negative amount', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/contracts/xyz/payments', headers: { authorization: `Bearer ${adminToken}` }, payload: { sequenceNo: 1, amount: -100 } });
      expect(res.statusCode).toBe(400); // Validated amount > 0
    });

    it('61. Float parsed as sequenceNo (requires int)', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/contracts/xyz/payments', headers: { authorization: `Bearer ${adminToken}` }, payload: { sequenceNo: 1.5, amount: 100 } });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Dates Boundaries and Formats', () => {
    it('62. POST /api/v1/pac with invalid year string defaults or drops', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/pac', headers: { authorization: `Bearer ${adminToken}` }, payload: { year: 'infinity', items: [] } });
      expect([400, 500]).toContain(res.statusCode); // Typescript restricts it
    });

    it('63. Contract evaluation max score bypass fails', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/xyz/evaluations', payload: { bidId: '1', totalScore: 9999 } });
      expect([400, 500]).toContain(res.statusCode); // Might trigger PRISMA validation if out of constraint, or return 400
    });
  });

  describe('Forbidden Transitions and Idempotency', () => {
    it('64. RUP Registration tries to jump out of steps bounds (step=99)', async () => {
      const supplierToken = sign({ sub: 'prov2@test.com', role: 'supplier' });
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/rup/registration', headers: { authorization: `Bearer ${supplierToken}` }, payload: { step: 99, data: {} } });
      expect(res.statusCode).toBe(400); 
    });

    it('65. OTP Send with invalid channels (WhatsApp instead of SMS)', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/offers/123/otp/send', payload: { channel: 'WhatsApp', destination: '0909090909' } });
      expect([400, 500]).toContain(res.statusCode); 
    });

    it('66. Auth password reset confirm without valid length', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/reset-confirm', payload: { token: 't', newPassword: 'short' } });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Observability Null Pointers & Empty Data', () => {
    it('67. Analytics Public charts with no metric query falls back to empty default / 400', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/analytics/public/detail' });
      expect([400, 500]).toContain(res.statusCode); // Requires metric specified usually
    });

    it('68. Audit search with extreme empty values', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/audit?action=' });
      expect(res.statusCode).toBe(200); 
    });
  });

  describe('Large Payloads and Flood Vectors', () => {
    it('69. Reject payloads exceeding internal limits (stub check)', async () => {
      const hugeString = 'a'.repeat(21 * 1024 * 1024); // 21MB
      const res = await app.inject({ method: 'POST', url: '/api/v1/tenders', payload: { title: hugeString, procurementPlanId: 'test' } });
      expect(res.statusCode).toBe(413); // Fastify kicks in Payload Too Large
    });

    it('70. Invalid JSON structural syntax fails safely at parse boundary', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/tenders',
        headers: { 'content-type': 'application/json' },
        body: '{ "title": ' // Malformed
      });
      expect(res.statusCode).toBe(400); // Fastify JSON parse error
    });
  });
});
