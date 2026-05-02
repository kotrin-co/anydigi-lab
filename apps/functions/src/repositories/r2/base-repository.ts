import duckdb from "duckdb";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ACCOUNT_ID,
  R2_BUCKET,
  SCHEMAS,
} from "../../constants/r2";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export class R2BaseRepository {
  protected bucket = R2_BUCKET;
  protected accountId = R2_ACCOUNT_ID;
  protected schemas = SCHEMAS;

  protected getObjectKey(prefix: string, partitionDate: string) {
    return `${prefix}/dt=${partitionDate}/part-${Date.now()}.parquet`;
  }

  protected getPartitionDate(date?: Date) {
    return (date ?? new Date()).toISOString().slice(0, 10);
  }

  protected getTimestamp(dateStr?: string): string {
    return (dateStr ? new Date(dateStr) : new Date()).toISOString();
  }

  private async getConnection(): Promise<{
    db: duckdb.Database;
    conn: duckdb.Connection;
  }> {
    const db = new duckdb.Database(":memory:");
    const conn = db.connect();

    await this.runAsync(conn, "INSTALL httpfs;");
    await this.runAsync(conn, "LOAD httpfs;");
    await this.runAsync(
      conn,
      `
        CREATE OR REPLACE SECRET r2_secret (
          TYPE S3,
          KEY_ID '${this.esc(R2_ACCESS_KEY_ID)}',
          SECRET '${this.esc(R2_SECRET_ACCESS_KEY)}',
          ENDPOINT '${this.esc(this.accountId)}.r2.cloudflarestorage.com',
          URL_STYLE 'path',
          REGION 'auto'
        );
        `,
    );

    return { db, conn };
  }

  private runAsync(conn: duckdb.Connection, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      conn.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
  }

  private esc(s: string): string {
    return s.replace(/'/g, "''");
  }

  protected async insert(
    prefix: string,
    rows: Record<string, unknown>[],
    partitionDate?: string,
  ): Promise<{ objectKey: string; rowCount: number } | null> {
    if (rows.length === 0) return null;

    const dt = partitionDate ?? this.getPartitionDate();
    const objectKey = this.getObjectKey(prefix, dt);

    const { db, conn } = await this.getConnection();

    try {
      const ndjson = rows.map((row) => JSON.stringify(row)).join("\n");
      const tmpName = `staging_${Date.now()}`;
      const tmpPath = path.join(os.tmpdir(), `${tmpName}.ndjson`);

      try {
        await fs.writeFile(tmpPath, ndjson);

        await this.runAsync(
          conn,
          `
        CREATE TEMP TABLE ${tmpName} AS
        SELECT * FROM read_json_auto('${this.esc(tmpPath)}')
        `,
        );

        await this.runAsync(
          conn,
          `
        COPY (SELECT * FROM ${tmpName})
        TO 's3://${this.bucket}/${objectKey}'
        (FORMAT PARQUET, COMPRESSION ZSTD);
        `,
        );

        return { objectKey, rowCount: rows.length };
      } finally {
        await fs.unlink(tmpPath).catch(() => {});
      }
    } finally {
      db.close();
    }
  }

  protected async query<T = unknown>(sql: string): Promise<T[]> {
    const { db, conn } = await this.getConnection();

    try {
      const rows = await new Promise<unknown[]>((resolve, reject) => {
        conn.all(sql, (err, rows) =>
          err ? reject(err) : resolve(rows as unknown[]),
        );
      });
      return rows.map((row) => this.normalize(row)) as T[];
    } finally {
      db.close();
    }
  }

  private normalize(value: unknown): unknown {
    if (typeof value === "bigint") {
      return Number(value);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.normalize(v));
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.normalize(v);
      }
      return out;
    }
    return value;
  }
}
