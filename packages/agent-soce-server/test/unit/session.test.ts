/**
 * Unit Tests — Session TTL (UT-07)
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Test session expiry logic without Redis (mock)
interface SessionData {
  userId: string;
  data: Record<string, unknown>;
  expiresAt: number;
}

class MemorySessionStore {
  private store = new Map<string, SessionData>();

  set(id: string, data: Record<string, unknown>, ttlSeconds: number): void {
    this.store.set(id, {
      userId: data.userId as string,
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get(id: string): Record<string, unknown> | null {
    const session = this.store.get(id);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.store.delete(id);
      return null;
    }
    return session.data;
  }

  delete(id: string): void {
    this.store.delete(id);
  }

  cleanup(): number {
    let cleaned = 0;
    for (const [id, session] of this.store) {
      if (Date.now() > session.expiresAt) {
        this.store.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

describe('Session TTL (UT-07)', () => {
  it('stores and retrieves session data', () => {
    const store = new MemorySessionStore();
    store.set('sess-1', { userId: 'user-1', route: '/cp/processes' }, 3600);
    const retrieved = store.get('sess-1');
    assert.ok(retrieved !== null);
    assert.equal(retrieved?.userId, 'user-1');
  });

  it('returns null for non-existent session', () => {
    const store = new MemorySessionStore();
    assert.equal(store.get('non-existent'), null);
  });

  it('expires session after TTL', () => {
    const store = new MemorySessionStore();
    // Set with 0 seconds TTL (already expired)
    store.set('sess-expired', { userId: 'user-2' }, 0);
    // Small delay to ensure expiry
    const before = Date.now();
    while (Date.now() - before < 10) { /* busy wait 10ms */ }
    const retrieved = store.get('sess-expired');
    assert.equal(retrieved, null, 'Expired session should return null');
  });

  it('cleanup removes only expired sessions', () => {
    const store = new MemorySessionStore();
    store.set('active', { userId: 'u1' }, 3600);
    store.set('expired', { userId: 'u2' }, 0);

    const before = Date.now();
    while (Date.now() - before < 10) { /* wait */ }

    const cleaned = store.cleanup();
    assert.equal(cleaned, 1, 'Should clean only 1 expired session');
    assert.ok(store.get('active') !== null, 'Active session should survive');
  });

  it('delete removes session', () => {
    const store = new MemorySessionStore();
    store.set('to-delete', { userId: 'u3' }, 3600);
    store.delete('to-delete');
    assert.equal(store.get('to-delete'), null);
  });
});
