import pg from 'pg';

const { Pool } = pg;

export interface DataSourceConfig {
  id: string;
  name: string;
  type: string;
  connectionUrl: string;
  schema?: string | null;
  maxPoolSize: number;
  timeoutMs: number;
}

export class DataSourceRegistry {
  private pools = new Map<string, pg.Pool>();
  private configs = new Map<string, DataSourceConfig>();

  register(config: DataSourceConfig): void {
    this.configs.set(config.id, config);
  }

  private getPool(id: string): pg.Pool {
    if (this.pools.has(id)) return this.pools.get(id)!;

    const config = this.configs.get(id);
    if (!config) throw new Error(`Data source "${id}" not registered`);

    const pool = new Pool({
      connectionString: config.connectionUrl,
      max: config.maxPoolSize,
      idleTimeoutMillis: config.timeoutMs,
      query_timeout: config.timeoutMs,
    });

    this.pools.set(id, pool);
    return pool;
  }

  async query(id: string, sql: string, params?: unknown[]): Promise<pg.QueryResult> {
    const pool = this.getPool(id);
    const client = await pool.connect();
    try {
      await client.query('SET TRANSACTION READ ONLY');
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async testConnection(id: string): Promise<{ ok: boolean; error?: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const pool = this.getPool(id);
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, error: String(err), latencyMs: Date.now() - start };
    }
  }

  async getCatalog(id: string): Promise<Array<{ table: string; column: string; dataType: string }>> {
    const config = this.configs.get(id);
    const schemaName = config?.schema ?? 'public';
    const result = await this.query(
      id,
      `SELECT table_name AS table, column_name AS column, data_type AS "dataType"
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position`,
      [schemaName],
    );
    return result.rows;
  }

  async close(): Promise<void> {
    for (const pool of this.pools.values()) {
      await pool.end();
    }
    this.pools.clear();
  }
}
