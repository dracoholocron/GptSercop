export interface DataPermission {
  tableName: string;
  allowedColumns: string[];
  rowFilter: string | null;
  accessLevel: string;
}

export interface AllowedSchema {
  tables: Map<string, { columns: string[]; rowFilter: string | null; accessLevel: string }>;
}

export function buildAllowedSchema(permissions: DataPermission[]): AllowedSchema {
  const tables = new Map<string, { columns: string[]; rowFilter: string | null; accessLevel: string }>();

  for (const p of permissions) {
    if (p.accessLevel === 'none') continue;
    tables.set(p.tableName, {
      columns: p.allowedColumns,
      rowFilter: p.rowFilter,
      accessLevel: p.accessLevel,
    });
  }

  return { tables };
}

export function isTableAllowed(schema: AllowedSchema, tableName: string): boolean {
  return schema.tables.has(tableName) || schema.tables.has('*');
}

export function getRowFilter(schema: AllowedSchema, tableName: string): string | null {
  return schema.tables.get(tableName)?.rowFilter
    ?? schema.tables.get('*')?.rowFilter
    ?? null;
}

export function getAllowedColumns(schema: AllowedSchema, tableName: string): string[] | null {
  const entry = schema.tables.get(tableName) ?? schema.tables.get('*');
  if (!entry) return null;
  return entry.columns.length > 0 ? entry.columns : null;
}
