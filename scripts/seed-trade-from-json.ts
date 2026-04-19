/**
 * 旧AnyTradeのJSONデータをNeon trade.*に投入するスクリプト
 *
 * Usage:
 *   npx tsx scripts/seed-trade-from-json.ts <screening_json> [tierS_json] [tierA_json]
 *
 * Example:
 *   npx tsx scripts/seed-trade-from-json.ts \
 *     /tmp/any-trade/web/public/data/jp/screening_results.json \
 *     /tmp/any-trade/web/public/data/jp/tierS.json \
 *     /tmp/any-trade/web/public/data/jp/tierA.json
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  screeningBatches,
  stocks,
  portfolioSummaries,
} from "../src/lib/schema/trade";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type StockJson = {
  rank: number;
  code: string;
  name: string;
  market?: string;
  industry?: string;
  price?: number;
  yield_pct?: number;
  per?: number | null;
  pbr?: number | null;
  roe?: number | null;
  market_cap_million?: number | null;
  segment: string;
  total_score?: number | null;
  max_score?: number;
  industry_score?: number | null;
  industry_category?: string | null;
  disqualified?: boolean | null;
  disqualified_reason?: string | null;
  special_dividend_suspected?: boolean | null;
  normal_yield_pct?: number | null;
  loss_years?: number | null;
  dividend_history_years?: number | null;
  tier?: string | null;
  business?: string | null;
  tailwinds?: string[];
  headwinds?: string[];
  growth_comment?: string | null;
  dividend_sustainability?: string | null;
  recommended_position?: string | null;
  watch_points?: string[];
};

type ScreeningJson = {
  generated_at: string;
  source: string;
  note: string;
  total_count: number;
  max_score: number;
  stocks: StockJson[];
};

type TierJson = {
  generated_at: string;
  source: string;
  note: string;
  stocks: StockJson[];
  portfolio_summary?: {
    sector_bias: string;
    recommendation: string;
    core_candidates: string[];
    satellite_candidates: string[];
  };
};

async function main() {
  const [screeningPath, tierSPath, tierAPath] = process.argv.slice(2);

  if (!screeningPath) {
    console.error("Usage: npx tsx scripts/seed-trade-from-json.ts <screening_json> [tierS_json] [tierA_json]");
    process.exit(1);
  }

  // 1. Load JSON files
  const screening: ScreeningJson = JSON.parse(readFileSync(screeningPath, "utf-8"));
  console.log(`Screening: ${screening.total_count} stocks, ${screening.generated_at}`);

  const tierS: TierJson | null = tierSPath
    ? JSON.parse(readFileSync(tierSPath, "utf-8"))
    : null;
  const tierA: TierJson | null = tierAPath
    ? JSON.parse(readFileSync(tierAPath, "utf-8"))
    : null;

  if (tierS) console.log(`Tier S: ${tierS.stocks.length} stocks`);
  if (tierA) console.log(`Tier A: ${tierA.stocks.length} stocks`);

  // Build tier lookup: code → tier stock data
  const tierLookup = new Map<string, StockJson & { tier: string }>();
  if (tierS) {
    for (const s of tierS.stocks) {
      tierLookup.set(s.code, { ...s, tier: "S" });
    }
  }
  if (tierA) {
    for (const s of tierA.stocks) {
      tierLookup.set(s.code, { ...s, tier: "A" });
    }
  }

  // 2. Create batch
  const [batch] = await db
    .insert(screeningBatches)
    .values({
      genre: "jp-high-dividend",
      generatedAt: screening.generated_at,
      source: screening.source,
      note: screening.note,
      totalCount: screening.total_count,
      maxScore: screening.max_score,
    })
    .returning({ id: screeningBatches.id });

  console.log(`Created batch #${batch.id}`);

  // 3. Insert stocks (merge screening + tier data)
  const stockRows = screening.stocks.map((s) => {
    const tier = tierLookup.get(s.code);
    return {
      batchId: batch.id,
      code: s.code,
      name: s.name,
      market: s.market ?? null,
      industry: s.industry ?? null,
      price: s.price ?? null,
      yieldPct: s.yield_pct ?? null,
      per: s.per ?? null,
      pbr: s.pbr ?? null,
      roe: s.roe ?? null,
      marketCapMillion: s.market_cap_million ?? null,
      segment: s.segment,
      rank: s.rank,
      totalScore: s.total_score ?? null,
      maxScore: s.max_score ?? null,
      industryScore: s.industry_score ?? null,
      industryCategory: s.industry_category ?? null,
      disqualified: s.disqualified ?? null,
      disqualifiedReason: s.disqualified_reason ?? null,
      specialDividendSuspected: s.special_dividend_suspected ?? null,
      normalYieldPct: s.normal_yield_pct ?? null,
      lossYears: s.loss_years ?? null,
      dividendHistoryYears: s.dividend_history_years ?? null,
      // Tier analysis fields (from tierS/A JSON if available)
      tier: tier?.tier ?? s.tier ?? null,
      business: tier?.business ?? s.business ?? null,
      tailwinds: tier?.tailwinds ?? s.tailwinds ?? [],
      headwinds: tier?.headwinds ?? s.headwinds ?? [],
      growthComment: tier?.growth_comment ?? s.growth_comment ?? null,
      dividendSustainability: tier?.dividend_sustainability ?? s.dividend_sustainability ?? null,
      recommendedPosition: tier?.recommended_position ?? s.recommended_position ?? null,
      watchPoints: tier?.watch_points ?? s.watch_points ?? [],
    };
  });

  // Insert in chunks of 100 (Neon HTTP has payload limits)
  const CHUNK_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < stockRows.length; i += CHUNK_SIZE) {
    const chunk = stockRows.slice(i, i + CHUNK_SIZE);
    await db.insert(stocks).values(chunk);
    inserted += chunk.length;
    console.log(`  Inserted ${inserted}/${stockRows.length} stocks`);
  }

  // 4. Insert portfolio summaries
  for (const [tierLabel, tierData] of [["S", tierS], ["A", tierA]] as const) {
    const summary = tierData?.portfolio_summary;
    if (!summary) continue;
    await db.insert(portfolioSummaries).values({
      batchId: batch.id,
      tier: tierLabel,
      sectorBias: summary.sector_bias,
      recommendation: summary.recommendation,
      coreCandidates: summary.core_candidates,
      satelliteCandidates: summary.satellite_candidates,
    });
    console.log(`  Portfolio summary for Tier ${tierLabel} inserted`);
  }

  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
