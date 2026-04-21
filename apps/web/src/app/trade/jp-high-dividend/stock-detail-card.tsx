"use client";

import { calcValueScore } from "@/lib/trade/valuation";

type Stock = {
  code: string;
  name: string;
  industry: string | null;
  price: number | null;
  yieldPct: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  totalScore: number | null;
  maxScore: number | null;
  compositeScore: number | null;
  financialScoreRaw: number | null;
  dividendHistoryYears: number | null;
  business: string | null;
  tailwinds: string[];
  headwinds: string[];
  growthComment: string | null;
  dividendSustainability: string | null;
  recommendedPosition: string | null;
  watchPoints: string[];
  // 8項目スコア内訳
  scoreRevenueTrend: number | null;
  scoreEpsTrend: number | null;
  scoreOperatingMargin: number | null;
  scoreEquityRatio: number | null;
  scoreOperatingCf: number | null;
  scoreCashTrend: number | null;
  scoreDividendTrend: number | null;
  scorePayoutRatio: number | null;
};

const sustainabilityLabel: Record<string, { text: string; color: string }> = {
  very_high: { text: "非常に高い", color: "text-emerald-500" },
  high: { text: "高い", color: "text-emerald-500" },
  mid_high: { text: "やや高い", color: "text-blue-500" },
  mid: { text: "普通", color: "text-yellow-500" },
  low: { text: "低い", color: "text-red-500" },
};

const positionLabel: Record<string, { text: string; color: string }> = {
  core: {
    text: "Core",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
  satellite: {
    text: "Satellite",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  watchlist: {
    text: "Watchlist",
    color: "bg-muted text-muted-foreground border-border",
  },
};

export function StockDetailCard({ stock }: { stock: Stock }) {
  const sus = stock.dividendSustainability
    ? sustainabilityLabel[stock.dividendSustainability]
    : null;
  const pos = stock.recommendedPosition
    ? positionLabel[stock.recommendedPosition]
    : null;
  const vs = calcValueScore(stock.roe, stock.pbr);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {stock.name}
            </h3>
            <span className="font-mono text-sm text-muted-foreground">
              {stock.code}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stock.industry}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pos && (
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${pos.color}`}
            >
              {pos.text}
            </span>
          )}
          <span className="font-mono text-xl font-semibold text-emerald-500">
            {stock.yieldPct?.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Stat
          label="財務スコア"
          value={stock.financialScoreRaw != null ? `${stock.financialScoreRaw}/100` : "—"}
        />
        <Stat
          label="株価"
          value={stock.price ? `¥${stock.price.toLocaleString()}` : "—"}
        />
        <Stat
          label="PER"
          value={stock.per ? `${stock.per.toFixed(1)}倍` : "—"}
        />
        <Stat
          label="PBR"
          value={stock.pbr ? `${stock.pbr.toFixed(2)}倍` : "—"}
        />
        <Stat
          label="ROE"
          value={stock.roe ? `${stock.roe.toFixed(1)}%` : "—"}
        />
        <Stat
          label="配当履歴"
          value={`${stock.dividendHistoryYears ?? "—"}年`}
        />
        {vs && (
          <div>
            <p className="text-[11px] text-muted-foreground">
              割安度 (理論PBR比)
            </p>
            <p className={`font-medium ${vs.color}`}>
              {vs.label}
              <span className="ml-1 text-xs opacity-70">
                {vs.ratio.toFixed(2)}x
              </span>
            </p>
          </div>
        )}
        {sus && (
          <div>
            <p className="text-[11px] text-muted-foreground">配当持続性</p>
            <p className={`font-medium ${sus.color}`}>{sus.text}</p>
          </div>
        )}
      </div>

      {/* Business */}
      {stock.business && (
        <p className="text-sm text-muted-foreground">{stock.business}</p>
      )}

      {/* 8項目財務スコア レーダーチャート */}
      {stock.financialScoreRaw != null && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            財務スコア内訳（{stock.financialScoreRaw}/100）
          </p>
          <RadarChart
            items={[
              { label: "売上高", score: stock.scoreRevenueTrend ?? 0, max: 15 },
              { label: "EPS", score: stock.scoreEpsTrend ?? 0, max: 15 },
              { label: "営業利益率", score: stock.scoreOperatingMargin ?? 0, max: 15 },
              { label: "自己資本比率", score: stock.scoreEquityRatio ?? 0, max: 10 },
              { label: "営業CF", score: stock.scoreOperatingCf ?? 0, max: 15 },
              { label: "現金等", score: stock.scoreCashTrend ?? 0, max: 5 },
              { label: "配当金", score: stock.scoreDividendTrend ?? 0, max: 15 },
              { label: "配当性向", score: stock.scorePayoutRatio ?? 0, max: 10 },
            ]}
          />
        </div>
      )}

      {/* Tailwinds / Headwinds */}
      <div className="grid gap-4 md:grid-cols-2">
        {stock.tailwinds.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-emerald-500">
              追い風
            </p>
            <ul className="space-y-1">
              {stock.tailwinds.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 text-emerald-500">+</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {stock.headwinds.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-red-500">逆風</p>
            <ul className="space-y-1">
              {stock.headwinds.map((h, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 text-red-500">-</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Growth comment */}
      {stock.growthComment && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            成長性コメント
          </p>
          <p className="text-sm text-muted-foreground">{stock.growthComment}</p>
        </div>
      )}

      {/* Watch points */}
      {stock.watchPoints.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-yellow-500">
            監視ポイント
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stock.watchPoints.map((w, i) => (
              <span
                key={i}
                className="rounded-md bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-mono font-medium text-foreground">{value}</p>
    </div>
  );
}

function RadarChart({
  items,
}: {
  items: { label: string; score: number; max: number }[];
}) {
  const n = items.length;
  const cx = 120;
  const cy = 120;
  const r = 80;
  const labelR = r + 24;

  // 各軸の角度（上から時計回り）
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const px = (i: number, radius: number) => cx + radius * Math.cos(angle(i));
  const py = (i: number, radius: number) => cy + radius * Math.sin(angle(i));

  // グリッド線（20%, 40%, 60%, 80%, 100%）
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // データポイント
  const points = items
    .map((item, i) => {
      const pct = item.max > 0 ? item.score / item.max : 0;
      return `${px(i, r * pct)},${py(i, r * pct)}`;
    })
    .join(" ");

  return (
    <div className="flex justify-center">
      <svg width={240} height={240} className="overflow-visible">
        {/* グリッド */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={Array.from({ length: n }, (_, i) => `${px(i, r * level)},${py(i, r * level)}`).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={level === 1 ? 1 : 0.5}
          />
        ))}
        {/* 軸線 */}
        {items.map((_, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={px(i, r)}
            y2={py(i, r)}
            stroke="currentColor"
            className="text-border"
            strokeWidth={0.5}
          />
        ))}
        {/* データ領域 */}
        <polygon
          points={points}
          fill="rgb(139 92 246 / 0.15)"
          stroke="rgb(139 92 246)"
          strokeWidth={2}
        />
        {/* データ点 */}
        {items.map((item, i) => {
          const pct = item.max > 0 ? item.score / item.max : 0;
          return (
            <circle
              key={i}
              cx={px(i, r * pct)}
              cy={py(i, r * pct)}
              r={3}
              fill="rgb(139 92 246)"
            />
          );
        })}
        {/* ラベル */}
        {items.map((item, i) => {
          const lx = px(i, labelR);
          const ly = py(i, labelR);
          const anchor =
            Math.abs(lx - cx) < 5 ? "middle" : lx > cx ? "start" : "end";
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="central"
              className="fill-muted-foreground"
              fontSize={10}
            >
              {item.label} {item.score}/{item.max}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
