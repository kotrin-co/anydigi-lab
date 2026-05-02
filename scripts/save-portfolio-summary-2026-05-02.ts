import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, eq } from "drizzle-orm";
import {
  portfolioSummaries,
  screeningBatches,
} from "@anydigi-lab/database/schema/trade";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  console.log(`latest batch: ${batch.id} (${batch.generatedAt})`);

  const [row] = await db
    .insert(portfolioSummaries)
    .values({
      batchId: batch.id,
      tier: "S",
      sectorBias:
        "Tier Sはサービス業・情報通信業に4銘柄が集中し、知識集約産業（コンサル・SaaS・M&A仲介）偏重。残り3銘柄も金融保証(7191)・卸売(8117)・機械(6432)で内需+輸出ニッチへの分散はあるが、食品・素材・ヘルスケア・公益等の景気耐性セクターが不在。",
      recommendation:
        "Tier S 単独だとサービス業・情報通信偏重。Tier A の 1414(土木補修)・3003(都心不動産)・7164(住宅ローン保証)・7979(歯科材料海外)・6223(産業用除湿機)を組み合わせて、内需インフラ＋ヘルスケア＋グローバルニッチ製造で景気耐性セクターを補完。3925 のサテライト枠は犯収法改正(2027/4)後の業績反転を確認できるまでサイズを抑える。",
      coreCandidates: ["7191", "6432", "8117", "6200", "6196", "3921"],
      satelliteCandidates: ["3925"],
    })
    .returning();

  console.log("Inserted portfolio summary:", row);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
