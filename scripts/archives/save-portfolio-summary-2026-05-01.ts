import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import { screeningBatches, portfolioSummaries } from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  console.log(`latest batch: ${batch.id} (${batch.generatedAt})`);

  const result = await db
    .insert(portfolioSummaries)
    .values({
      batchId: batch.id,
      tier: "S",
      sectorBias:
        "情報・通信＋サービス業（特に中小企業DX・教育・コンサル領域）に4銘柄（6200/3925/3921/6196）が集中。実物セクター（6432建機・8117自動車用品）と金融（7191保証）で分散はあるものの、IT・サービス偏重が継続。海外売上比率も6432・8117で重複し、米国関税リスクが二重に効く構造。",
      recommendation:
        "core 6銘柄（6432/6200/7191/8117/6196/3921）でディフェンシブ＋構造成長を確保し、satellite 1銘柄（3925）で2027年4月犯収法改正のイベントドリブン上振れを狙う。米国関税の影響を受ける6432と8117を同時に多く持ちすぎないよう、エクスポージャは合計でポートフォリオの30%を超えない調整が望ましい。3925は次回決算（5/13）で大きく動く可能性あり、ポジションは小さめに。",
      coreCandidates: ["6432", "6200", "7191", "8117", "6196", "3921"],
      satelliteCandidates: ["3925"],
    })
    .returning({ id: portfolioSummaries.id });

  console.log(`✓ portfolio_summary inserted: id=${result[0].id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
