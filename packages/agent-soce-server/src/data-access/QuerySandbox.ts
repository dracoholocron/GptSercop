import type { AllowedSchema } from './PermissionFilter.js';
import { isTableAllowed, getRowFilter, getAllowedColumns } from './PermissionFilter.js';
import type { DataSourceRegistry } from './DataSourceRegistry.js';

const BLOCKED_PATTERNS = [
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i,
  /\bpg_\w+/i,
  /\binformation_schema\b/i,
  /\b(COPY|LOAD)\b/i,
  /;\s*\w/,
];

const PII_COLUMNS = new Set([
  'cedula', 'ruc', 'phone', 'telefono', 'email', 'correo',
  'direccion', 'address', 'password', 'token', 'secret',
]);

export interface SandboxResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
}

export function validateSQL(sql: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sql)) {
      return { valid: false, reason: `Blocked pattern: ${pattern.source}` };
    }
  }
  return { valid: true };
}

export function maskPII(
  rows: Record<string, unknown>[],
  allowedColumns: string[] | null,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (PII_COLUMNS.has(key.toLowerCase()) && (!allowedColumns || !allowedColumns.includes(key))) {
        masked[key] = '***REDACTED***';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  });
}

export async function executeSandboxed(
  registry: DataSourceRegistry,
  dataSourceId: string,
  sql: string,
  schema: AllowedSchema,
  userParams?: Record<string, string>,
): Promise<SandboxResult> {
  const validation = validateSQL(sql);
  if (!validation.valid) {
    throw new Error(`Query rejected: ${validation.reason}`);
  }

  const tableMatch = sql.match(/FROM\s+["']?(\w+)["']?/i);
  const tableName = tableMatch?.[1];

  if (tableName && !isTableAllowed(schema, tableName)) {
    throw new Error(`Access denied: table "${tableName}" is not permitted for this role`);
  }

  let finalSql = sql;

  if (tableName) {
    const columns = getAllowedColumns(schema, tableName);
    if (columns && columns.length > 0) {
      finalSql = finalSql.replace(
        /SELECT\s+\*/i,
        `SELECT ${columns.map((c) => `"${c}"`).join(', ')}`,
      );
    }

    const rowFilter = getRowFilter(schema, tableName);
    if (rowFilter) {
      let resolvedFilter = rowFilter;
      if (userParams) {
        for (const [key, value] of Object.entries(userParams)) {
          resolvedFilter = resolvedFilter.replace(`:${key}`, `'${value.replace(/'/g, "''")}'`);
        }
      }
      const hasWhere = /\bWHERE\b/i.test(finalSql);
      finalSql = hasWhere
        ? finalSql.replace(/WHERE\b/i, `WHERE (${resolvedFilter}) AND`)
        : `${finalSql} WHERE ${resolvedFilter}`;
    }
  }

  if (!/\bLIMIT\b/i.test(finalSql)) {
    finalSql += ' LIMIT 101';
  }

  const result = await registry.query(dataSourceId, finalSql);
  const MAX_ROWS = 100;
  const MAX_COLS = 10;

  let rows = result.rows as Record<string, unknown>[];
  const truncated = rows.length > MAX_ROWS;
  rows = rows.slice(0, MAX_ROWS);

  rows = rows.map((row) => {
    const keys = Object.keys(row).slice(0, MAX_COLS);
    const trimmed: Record<string, unknown> = {};
    for (const k of keys) trimmed[k] = row[k];
    return trimmed;
  });

  const allowedCols = tableName ? getAllowedColumns(schema, tableName) : null;
  rows = maskPII(rows, allowedCols);

  return { rows, rowCount: rows.length, truncated };
}
