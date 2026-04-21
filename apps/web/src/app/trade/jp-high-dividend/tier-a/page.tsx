import Link from "next/link";
import { db } from "@anydigi-lab/database/db";
import {
  screeningBatches,
  stocks,
  portfolioSummaries,
} from "@anydigi-lab/database/schema/trade";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { StockDetailCard } from "../stock-detail-card";

async function getTierAData() {
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  if (!batch) return null;

  const [tierStocks, [summary]] = await Promise.all([
    db
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.batchId, batch.id),
          eq(stocks.segment, "corporate"),
          gte(stocks.compositeScore, 80),
          lt(stocks.compositeScore, 90)
        )
      )
      .orderBy(desc(stocks.compositeScore)),
    db
      .select()
      .from(portfolioSummaries)
      .where(
        and(
          eq(portfolioSummaries.batchId, batch.id),
          eq(portfolioSummaries.tier, "A")
        )
      )
      .limit(1),
  ]);

  return { batch, stocks: tierStocks, summary };
}

export default async function TierAPage() {
  const data = await getTierAData();

  if (!data || data.stocks.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <BackLink />
        <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Tier A 銘柄がありません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <BackLink />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tier A 銘柄（80-89点）
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.stocks.length}銘柄 / データ取得日: {data.batch.generatedAt}
        </p>
      </div>

      {/* Portfolio summary */}
      {data.summary && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-500">
            ポートフォリオサマリー
          </p>
          {data.summary.sectorBias && (
            <p className="text-sm text-muted-foreground">
              {data.summary.sectorBias}
            </p>
          )}
          {data.summary.recommendation && (
            <p className="text-sm text-muted-foreground">
              {data.summary.recommendation}
            </p>
          )}
          <div className="flex gap-4 pt-1">
            {data.summary.coreCandidates &&
              (data.summary.coreCandidates as string[]).length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Core候補</p>
                  <p className="font-mono text-sm text-foreground">
                    {(data.summary.coreCandidates as string[]).join(", ")}
                  </p>
                </div>
              )}
            {data.summary.satelliteCandidates &&
              (data.summary.satelliteCandidates as string[]).length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Satellite候補
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {(data.summary.satelliteCandidates as string[]).join(", ")}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Stock cards */}
      <div className="space-y-4">
        {data.stocks.map((stock) => (
          <StockDetailCard
            key={stock.id}
            stock={{
              ...stock,
              tailwinds: (stock.tailwinds as string[]) ?? [],
              headwinds: (stock.headwinds as string[]) ?? [],
              watchPoints: (stock.watchPoints as string[]) ?? [],
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/trade/jp-high-dividend"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      一覧に戻る
    </Link>
  );
}
