/**
 * Unit Tests — Permission Filter and QuerySandbox (UT-08, UT-09)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllowedSchema, isTableAllowed, getRowFilter, getAllowedColumns } from '../../src/data-access/PermissionFilter.js';
import { validateSQL, maskPII } from '../../src/data-access/QuerySandbox.js';

describe('PermissionFilter (UT-08)', () => {
  it('builds schema from permissions', () => {
    const schema = buildAllowedSchema([
      { tableName: 'Tender', allowedColumns: ['id', 'title', 'budget'], rowFilter: '"entityId" = :userEntityId', accessLevel: 'read' },
      { tableName: 'Contract', allowedColumns: [], rowFilter: null, accessLevel: 'read' },
    ]);
    assert.ok(schema.tables.has('Tender'));
    assert.ok(schema.tables.has('Contract'));
  });

  it('correctly restricts columns for entity_user role', () => {
    const schema = buildAllowedSchema([
      { tableName: 'Tender', allowedColumns: ['id', 'title', 'budget'], rowFilter: '"entityId" = :e', accessLevel: 'read' },
    ]);
    const cols = getAllowedColumns(schema, 'Tender');
    assert.deepEqual(cols, ['id', 'title', 'budget']);
  });

  it('returns null (all columns) when allowedColumns is empty', () => {
    const schema = buildAllowedSchema([
      { tableName: 'Contract', allowedColumns: [], rowFilter: null, accessLevel: 'read' },
    ]);
    const cols = getAllowedColumns(schema, 'Contract');
    assert.equal(cols, null);
  });

  it('correctly applies row filter', () => {
    const schema = buildAllowedSchema([
      { tableName: 'Tender', allowedColumns: [], rowFilter: '"entityId" = :entityId', accessLevel: 'read' },
    ]);
    const filter = getRowFilter(schema, 'Tender');
    assert.equal(filter, '"entityId" = :entityId');
  });

  it('denies access to tables not in permissions', () => {
    const schema = buildAllowedSchema([
      { tableName: 'Tender', allowedColumns: [], rowFilter: null, accessLevel: 'read' },
    ]);
    assert.equal(isTableAllowed(schema, 'pg_class'), false);
    assert.equal(isTableAllowed(schema, 'users'), false);
  });

  it('excludes permissions with accessLevel none', () => {
    const schema = buildAllowedSchema([
      { tableName: 'SensitiveTable', allowedColumns: [], rowFilter: null, accessLevel: 'none' },
    ]);
    assert.equal(isTableAllowed(schema, 'SensitiveTable'), false);
  });

  it('wildcard permission grants access to all tables', () => {
    const schema = buildAllowedSchema([
      { tableName: '*', allowedColumns: [], rowFilter: null, accessLevel: 'read' },
    ]);
    assert.equal(isTableAllowed(schema, 'Tender'), true);
    assert.equal(isTableAllowed(schema, 'Contract'), true);
  });
});

describe('QuerySandbox SQL validation (UT-09)', () => {
  it('blocks INSERT statement', () => {
    const result = validateSQL('INSERT INTO users VALUES (1, "hacker")');
    assert.equal(result.valid, false);
  });

  it('blocks UPDATE statement', () => {
    const result = validateSQL('UPDATE users SET password = "hacked"');
    assert.equal(result.valid, false);
  });

  it('blocks DELETE statement', () => {
    const result = validateSQL('DELETE FROM users');
    assert.equal(result.valid, false);
  });

  it('blocks DROP TABLE', () => {
    const result = validateSQL('DROP TABLE users');
    assert.equal(result.valid, false);
  });

  it('blocks pg_catalog access', () => {
    const result = validateSQL('SELECT * FROM pg_catalog.pg_tables');
    assert.equal(result.valid, false);
  });

  it('blocks information_schema access', () => {
    const result = validateSQL('SELECT * FROM information_schema.columns');
    assert.equal(result.valid, false);
  });

  it('allows valid SELECT', () => {
    const result = validateSQL('SELECT id, title FROM "Tender" WHERE dt = $1');
    assert.equal(result.valid, true);
  });

  it('masks PII columns', () => {
    const rows = [{ id: '1', name: 'Juan', cedula: '1234567890', amount: 1000 }];
    const masked = maskPII(rows, null);
    assert.equal(masked[0].cedula, '***REDACTED***');
    assert.equal(masked[0].id, '1');
    assert.equal(masked[0].amount, 1000);
  });
});
