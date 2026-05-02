import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

// 2026-04-30 取得分（batch_id=7）は Yahoo!ファイナンスの取引値セルが
// 市場開場中の時刻表記 "1,33811:30" だったところを scraper が剝がせず、
// `parseFloat` がカンマ除去後の連結文字列を読んで price が約100倍に膨張した。
// scraper は修正済み。膨張データは破棄する。

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  const before = await db.execute<{ rows: string }>(
    sql`SELECT COUNT(*)::text AS rows FROM trade.stocks WHERE batch_id = 7`
  );
  console.log(`batch_id=7 rows before: ${before.rows[0]?.rows}`);

  await db.execute(sql`DELETE FROM trade.stocks WHERE batch_id = 7`);

  const after = await db.execute<{ rows: string }>(
    sql`SELECT COUNT(*)::text AS rows FROM trade.stocks WHERE batch_id = 7`
  );
  console.log(`batch_id=7 rows after:  ${after.rows[0]?.rows}`);

  // screening_batches テーブルの該当行も消す
  await db.execute(sql`DELETE FROM trade.screening_batches WHERE id = 7`);
  console.log(`trade.screening_batches id=7 deleted`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
