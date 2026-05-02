import duckdb from "duckdb";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;

export const SCHEMAS = {
  STOCK_PROFILES: {
    prefix: "trade/stock_profiles",
    retentionDays: null,
  },
  STOCK_FINANCIALS: {
    prefix: "trade/stock_financials",
    retentionDays: null,
  },
} as const;

export class R2Client {
  private bucket = R2_BUCKET;
  private accountId = R2_ACCOUNT_ID;

  async appendParquet(
    prefix: string,
    rows: Record<string, unknown>[],
    partitionDate?: string,
  ): Promise<{ objectKey: string; rowCount: number } | null> {
    if (rows.length === 0) return null;

    const dt = partitionDate ?? this.todayString();
    const objectKey = `${prefix}/dt=${dt}/part-${Date.now()}.parquet`;

    const { db, conn } = await this.getConnection();
    try {
      const ndjson = rows.map((row) => JSON.stringify(row)).join("\n");
      const tmpName = `staging_${Date.now()}`;
      const tmpPath = path.join(os.tmpdir(), `${tmpName}.ndjson`);

      try {
        await fs.writeFile(tmpPath, ndjson);

        await this.runAsync(
          conn,
          `CREATE TEMP TABLE ${tmpName} AS
           SELECT * FROM read_json_auto('${this.esc(tmpPath)}')`,
        );

        await this.runAsync(
          conn,
          `COPY (SELECT * FROM ${tmpName})
           TO 's3://${this.bucket}/${objectKey}'
           (FORMAT PARQUET, COMPRESSION ZSTD)`,
        );

        return { objectKey, rowCount: rows.length };
      } finally {
        await fs.unlink(tmpPath).catch(() => {});
      }
    } finally {
      db.close();
    }
  }

  async query<T = unknown>(sql: string): Promise<T[]> {
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

  pathGlob(prefix: string): string {
    return `s3://${this.bucket}/${prefix}/dt=*/*.parquet`;
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
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
      `CREATE OR REPLACE SECRET r2_secret (
         TYPE S3,
         KEY_ID '${this.esc(R2_ACCESS_KEY_ID)}',
         SECRET '${this.esc(R2_SECRET_ACCESS_KEY)}',
         ENDPOINT '${this.esc(this.accountId)}.r2.cloudflarestorage.com',
         URL_STYLE 'path',
         REGION 'auto'
       )`,
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

  private normalize(value: unknown): unknown {
    if (typeof value === "bigint") return Number(value);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (Array.isArray(value)) return value.map((v) => this.normalize(v));
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

export const r2 = new R2Client();
