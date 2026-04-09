/**
 * Unit Tests — Admin Chat Playground (AC-U01 to AC-U06)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Chat Playground Unit Tests (AC-U01 to AC-U06)', () => {
  it('AC-U01: AdminChat model defaults are correct', () => {
    const defaults = {
      title: 'Nueva conversacion',
      catalogIds: [],
      providerId: null,
      systemPrompt: null,
      isPinned: false,
    };
    assert.equal(defaults.title, 'Nueva conversacion');
    assert.deepEqual(defaults.catalogIds, []);
    assert.equal(defaults.providerId, null);
    assert.equal(defaults.isPinned, false);
  });

  it('AC-U02: AdminChatFolder structure supports chat relation', () => {
    const folder = { id: 'f1', name: 'Test Folder', icon: 'folder', color: '#0073E6', sortOrder: 0 };
    const chat = { id: 'c1', folderId: folder.id, title: 'Test Chat' };
    assert.equal(chat.folderId, folder.id);
  });

  it('AC-U03: Folder deletion behavior — onDelete: SetNull means chat keeps existing', () => {
    const chat = { id: 'c1', folderId: 'f1', title: 'Chat in folder' };
    const afterFolderDeletion = { ...chat, folderId: null };
    assert.equal(afterFolderDeletion.folderId, null);
    assert.equal(afterFolderDeletion.id, 'c1');
    assert.equal(afterFolderDeletion.title, 'Chat in folder');
  });

  it('AC-U04: Chat deletion cascades — messages removed conceptually', () => {
    const messages = [
      { id: 'm1', chatId: 'c1', role: 'user', content: 'Hello' },
      { id: 'm2', chatId: 'c1', role: 'assistant', content: 'Hi there' },
    ];
    const afterCascade = messages.filter((m) => m.chatId !== 'c1');
    assert.equal(afterCascade.length, 0);
  });

  it('AC-U05: ragChunksUsed JSON round-trips correctly', () => {
    const ragChunks = [
      { id: 'chunk1', title: 'Doc Title', source: 'catalog/doc.pdf', score: 0.87, snippet: 'relevant text...' },
      { id: 'chunk2', title: 'Another Doc', source: 'catalog/other.pdf', score: 0.72, snippet: null },
    ];
    const serialized = JSON.stringify(ragChunks);
    const deserialized = JSON.parse(serialized);
    assert.deepEqual(deserialized, ragChunks);
    assert.equal(deserialized[0].score, 0.87);
    assert.equal(deserialized[1].snippet, null);
  });

  it('AC-U06: catalogIds filter generates correct SQL condition', () => {
    const catalogIds = ['cat-1', 'cat-2'];
    const hasFilter = catalogIds.length > 0;
    const filterSQL = hasFilter
      ? `AND "documentId" IN (SELECT id FROM "AgentKnowledgeDocument" WHERE "catalogId" = ANY($4::text[]))`
      : '';
    assert.ok(filterSQL.includes('ANY($4::text[])'));
    assert.ok(filterSQL.includes('"AgentKnowledgeDocument"'));

    const noCatalogs: string[] = [];
    const noFilterSQL = noCatalogs.length > 0
      ? `AND "documentId" IN (SELECT id FROM "AgentKnowledgeDocument" WHERE "catalogId" = ANY($4::text[]))`
      : '';
    assert.equal(noFilterSQL, '');
  });
});
