import { db } from "@anydigi-lab/database/db";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";
import { eq, desc } from "drizzle-orm";
import { StockTable } from "./stock-table";

async function getLatestScreening() {
  // 最新バッチを取得
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  if (!batch) return null;

  // バッチに紐づく全銘柄を取得
  const allStocks = await db
    .select()
    .from(stocks)
    .where(eq(stocks.batchId, batch.id));

  return { batch, stocks: allStocks };
}

export default async function JpHighDividendPage() {
  const data = await getLatestScreening();

  if (!data) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          日本株高配当
        </h1>
        <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            スクリーニングデータがありません
          </p>
        </div>
      </div>
    );
  }

  const corporateStocks = data.stocks.filter((s) => s.segment === "corporate");
  const qualifiedCount = corporateStocks.filter(
    (s) => !s.disqualified && s.compositeScore !== null
  ).length;
  const tierSCount = corporateStocks.filter(
    (s) => s.tier === "S"
  ).length;
  const tierACount = corporateStocks.filter(
    (s) => s.tier === "A"
  ).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          日本株高配当
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          配当利回り・増配年数ベースのスクリーニングと観測
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="対象銘柄" value={corporateStocks.length} sub={`全${data.batch.totalCount}銘柄中`} />
        <StatCard label="適格銘柄" value={qualifiedCount} sub="スコア算出済み" />
        <StatCard label="Tier S (90+)" value={tierSCount} sub="最優良銘柄" accent="emerald" href="/trade/jp-high-dividend/tier-s" />
        <StatCard label="Tier A (80-89)" value={tierACount} sub="優良銘柄" accent="blue" />
      </div>

      {/* Stock Table (client component) */}
      <StockTable stocks={corporateStocks} />

      <p className="text-xs text-muted-foreground">
        データ取得日: {data.batch.generatedAt} / ソース: {data.batch.source}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: string;
  href?: string;
}) {
  const borderClass =
    accent === "emerald"
      ? "border-emerald-500/30 hover:border-emerald-500/60"
      : accent === "blue"
        ? "border-blue-500/30 hover:border-blue-500/60"
        : "border-border";

  const content = (
    <div
      className={`rounded-lg border ${borderClass} bg-card p-4 transition-colors ${href ? "cursor-pointer group" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {href && (
          <svg
            className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold font-mono tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground truncate">
        {sub}
        {href && " →"}
      </p>
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }
  return content;
}
