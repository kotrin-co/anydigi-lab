import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import {
  screeningBatches,
  portfolioSummaries,
} from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  console.log(`Target batch: #${batch.id} (${batch.generatedAt})`);

  // 既存のサマリーがあれば削除（同一バッチでの再実行を許可）
  const existing = await db
    .select()
    .from(portfolioSummaries)
    .where(
      and(
        eq(portfolioSummaries.batchId, batch.id),
        eq(portfolioSummaries.tier, "S")
      )
    );

  if (existing.length > 0) {
    console.log(`Existing summary found, replacing...`);
    await db
      .delete(portfolioSummaries)
      .where(
        and(
          eq(portfolioSummaries.batchId, batch.id),
          eq(portfolioSummaries.tier, "S")
        )
      );
  }

  await db.insert(portfolioSummaries).values({
    batchId: batch.id,
    tier: "S",
    sectorBias:
      "Tier S 7銘柄のうち4銘柄（3925/3921/6200/6196）が情報・通信業またはサービス業に集中し、ITソフトウェア・コンサルティング業種に偏重。実物経済セクターは小型建機（6432）・自動車用品（8117）・保証サービス（7191）の3銘柄のみで、相対的にディフェンシブ性は高いものの、輸出依存(6432)・新車販売連動(8117)というシクリカル要素を内包する。",
    recommendation:
      "Coreで安定収益を確保しつつ、Satellite枠でテーマ性のある銘柄を組み合わせる構成が望ましい。情報通信・サービス業のCore銘柄(3921/6200/6196/7191)で配当成長と業績安定性を取り、海外・グローバル景気の上振れを取りにいくなら6432(関税の織り込みで底値感)、自動車市場×海外成長を取りにいくなら8117が候補。3925はDX市場の構造的成長を享受するが顧客集中リスクが大きいためSatellite限定が妥当。",
    coreCandidates: ["7191", "6432", "8117", "6200", "6196", "3921"],
    satelliteCandidates: ["3925"],
  });

  console.log("✓ Portfolio summary inserted");
  process.exit(0);
}

main();
