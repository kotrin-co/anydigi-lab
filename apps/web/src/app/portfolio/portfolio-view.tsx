"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  Bitcoin,
  Banknote,
  Building2,
  Shield,
  Briefcase,
  Landmark,
  DollarSign,
  Home,
  FileText,
} from "lucide-react";
import { addHolding, updateHolding, deleteHolding } from "./actions";

const ACCOUNTS = [
  { value: "", label: "口座を選択" },
  { value: "tokutei", label: "特定口座" },
  { value: "nisa_old", label: "旧つみたてNISA" },
  { value: "nisa_tsumitate", label: "NISA つみたて投資枠" },
  { value: "nisa_growth", label: "NISA 成長投資枠" },
  { value: "ideco", label: "iDeCo" },
  { value: "general", label: "一般口座" },
] as const;

const accountLabel: Record<string, string> = {
  tokutei: "特定",
  nisa_old: "旧NISA",
  nisa_tsumitate: "積立NISA",
  nisa_growth: "成長NISA",
  ideco: "iDeCo",
  general: "一般",
};

type Holding = {
  id: number;
  portfolioId: number;
  assetType: string;
  account: string | null;
  code: string | null;
  name: string;
  costBasis: number | null;
  marketValue: number | null;
  memo: string | null;
  updatedAt: Date;
};

const GENRES = [
  { type: "index_fund", label: "投資信託・REIT", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { type: "jp_stock", label: "日本個別株", icon: Landmark, color: "text-rose-500", bg: "bg-rose-500/10" },
  { type: "foreign_stock", label: "外国株", icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
  { type: "crypto", label: "暗号資産", icon: Bitcoin, color: "text-amber-500", bg: "bg-amber-500/10" },
  { type: "real_estate", label: "不動産", icon: Home, color: "text-orange-500", bg: "bg-orange-500/10" },
  { type: "bond", label: "債券（国債・社債）", icon: FileText, color: "text-teal-500", bg: "bg-teal-500/10" },
  { type: "pension", label: "年金（iDeCo等）", icon: Shield, color: "text-violet-500", bg: "bg-violet-500/10" },
  { type: "insurance", label: "保険・共済", icon: Building2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { type: "cash", label: "現金・預金", icon: Banknote, color: "text-lime-500", bg: "bg-lime-500/10" },
  { type: "business", label: "事業資産", icon: Briefcase, color: "text-pink-500", bg: "bg-pink-500/10" },
] as const;

function fmt(v: number | null) {
  if (v == null) return "—";
  return `¥${Math.round(v).toLocaleString()}`;
}

function pctChange(cost: number | null, market: number | null) {
  if (!cost || !market || cost === 0) return null;
  return ((market - cost) / cost) * 100;
}

// ── レーダーチャート用スコア計算 ──

function calcPortfolioScores(holdings: Holding[], showBusiness: boolean) {
  const items = showBusiness
    ? holdings
    : holdings.filter((h) => h.assetType !== "business");

  const total = items.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  if (total === 0) return null;

  const byType = (types: string[]) =>
    items
      .filter((h) => types.includes(h.assetType))
      .reduce((s, h) => s + (h.marketValue ?? 0), 0);

  const ratio = (types: string[]) => byType(types) / total;

  // 分散度: ジャンル数ベース + HHI補正
  const genreTotals = new Map<string, number>();
  for (const h of items) {
    genreTotals.set(h.assetType, (genreTotals.get(h.assetType) ?? 0) + (h.marketValue ?? 0));
  }
  const genreCount = genreTotals.size;
  const hhi = [...genreTotals.values()].reduce((s, v) => s + (v / total) ** 2, 0);
  // genreCount/10 × 50 + (1 - HHI) × 50 → 0〜100
  const diversification = Math.min(100, (genreCount / 10) * 50 + (1 - hhi) * 50);

  // リターン
  const totalCost = items.reduce((s, h) => s + (h.costBasis ?? 0), 0);
  const returnPct = totalCost > 0 ? ((total - totalCost) / totalCost) * 100 : 0;
  // -20%以下→0, +100%以上→100 にスケール
  const returnScore = Math.max(0, Math.min(100, (returnPct + 20) * (100 / 120)));

  // 安定性: 現金+債券+年金+保険 の比率
  const stableRatio = ratio(["cash", "bond", "pension", "insurance"]);
  // 30%で100点、0%で0点��60%超は減点（攻めが足りない）
  const stability = stableRatio <= 0.3
    ? (stableRatio / 0.3) * 100
    : Math.max(0, 100 - ((stableRatio - 0.3) / 0.3) * 50);

  // 成長性: 株+暗号資産+投資信託 の比率
  const growthRatio = ratio(["jp_stock", "foreign_stock", "crypto", "index_fund"]);
  // 50%で100点
  const growth = Math.min(100, (growthRatio / 0.5) * 100);

  // インカム: 配当・分配系（投信+個別株+REIT+債券）
  const incomeRatio = ratio(["index_fund", "jp_stock", "foreign_stock", "bond"]);
  const income = Math.min(100, (incomeRatio / 0.5) * 100);

  // 流動性: 即換金可能（現金+上場株+投信+暗号資産）
  const liquidRatio = ratio(["cash", "jp_stock", "foreign_stock", "index_fund", "crypto"]);
  const liquidity = Math.min(100, (liquidRatio / 0.7) * 100);

  return [
    { label: "分散度", score: Math.round(diversification), max: 100 },
    { label: "リターン", score: Math.round(returnScore), max: 100 },
    { label: "安定性", score: Math.round(stability), max: 100 },
    { label: "成長性", score: Math.round(growth), max: 100 },
    { label: "インカム", score: Math.round(income), max: 100 },
    { label: "流動性", score: Math.round(liquidity), max: 100 },
  ];
}

export function PortfolioView({ holdings }: { holdings: Holding[] }) {
  const [showBusiness, setShowBusiness] = useState(false);

  const visibleGenres = showBusiness
    ? GENRES
    : GENRES.filter((g) => g.type !== "business");

  // 合計計算（事業資産の表示/非表示に連動）
  const visibleTypes = new Set<string>(visibleGenres.map((g) => g.type));
  const visibleHoldings = holdings.filter((h) => visibleTypes.has(h.assetType));

  const totalCost = visibleHoldings.reduce((s, h) => s + (h.costBasis ?? 0), 0);
  const totalMarket = visibleHoldings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const totalPct = pctChange(totalCost, totalMarket);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">評価額合計</p>
          <p className="mt-1 text-2xl font-semibold font-mono tracking-tight text-foreground">
            {fmt(totalMarket || null)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">投資額合計</p>
          <p className="mt-1 text-2xl font-semibold font-mono tracking-tight text-foreground">
            {fmt(totalCost || null)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">損益</p>
          <p className={`mt-1 text-2xl font-semibold font-mono tracking-tight ${
            totalMarket - totalCost >= 0 ? "text-emerald-500" : "text-red-500"
          }`}>
            {totalCost > 0 ? fmt(totalMarket - totalCost) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">損益率</p>
          <p className={`mt-1 text-2xl font-semibold font-mono tracking-tight ${
            (totalPct ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
          }`}>
            {totalPct != null ? `${totalPct >= 0 ? "+" : ""}${totalPct.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      {(() => {
        const scores = calcPortfolioScores(holdings, showBusiness);
        return scores ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">ポートフォリオ健全度</h2>
            <PortfolioRadar items={scores} />
          </div>
        ) : null;
      })()}

      {/* Business toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">事業資産を合計に含める</span>
        <button
          onClick={() => setShowBusiness(!showBusiness)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            showBusiness ? "bg-pink-500" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              showBusiness ? "translate-x-4.5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Genre Sections */}
      {visibleGenres.map((genre) => {
        const items = holdings.filter((h) => h.assetType === genre.type);
        return (
          <GenreSection key={genre.type} genre={genre} holdings={items} />
        );
      })}
    </div>
  );
}

type Genre = (typeof GENRES)[number];

function GenreSection({
  genre,
  holdings: items,
}: {
  genre: Genre;
  holdings: Holding[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const subtotalCost = items.reduce((s, h) => s + (h.costBasis ?? 0), 0);
  const subtotalMarket = items.reduce((s, h) => s + (h.marketValue ?? 0), 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${genre.bg}`}>
            <genre.icon className={`h-4 w-4 ${genre.color}`} />
          </div>
          <h2 className="text-sm font-semibold text-foreground">{genre.label}</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {items.length}件
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {fmt(subtotalMarket || null)}
            </span>
          )}
          <button
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            追加
          </button>
        </div>
      </div>

      {/* Holdings List */}
      {items.length > 0 && (
        <div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
          {items.map((h, i) =>
            editingId === h.id ? (
              <HoldingForm
                key={h.id}
                assetType={genre.type}
                holding={h}
                onCancel={() => setEditingId(null)}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <HoldingRow
                key={h.id}
                holding={h}
                index={i}
                onEdit={() => { setEditingId(h.id); setAdding(false); }}
              />
            )
          )}
        </div>
      )}

      {/* Add Form */}
      {adding && (
        <HoldingForm
          assetType={genre.type}
          onCancel={() => setAdding(false)}
          onDone={() => setAdding(false)}
        />
      )}

      {/* Empty state */}
      {items.length === 0 && !adding && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            まだ登録されていません
          </p>
        </div>
      )}
    </div>
  );
}

function HoldingRow({
  holding,
  index,
  onEdit,
}: {
  holding: Holding;
  index: number;
  onEdit: () => void;
}) {
  const pct = pctChange(holding.costBasis, holding.marketValue);

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 group ${index % 2 === 1 ? "bg-muted/30" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {holding.name}
          </span>
          {holding.code && (
            <span className="text-xs font-mono text-muted-foreground">
              {holding.code}
            </span>
          )}
          {holding.account && accountLabel[holding.account] && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {accountLabel[holding.account]}
            </span>
          )}
        </div>
        {holding.memo && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {holding.memo}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-mono text-foreground">
          {fmt(holding.marketValue)}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs font-mono text-muted-foreground">
            {fmt(holding.costBasis)}
          </span>
          {pct != null && (
            <span
              className={`text-xs font-mono font-medium ${
                pct >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <form action={deleteHolding}>
          <input type="hidden" name="id" value={holding.id} />
          <button
            type="submit"
            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function HoldingForm({
  assetType,
  holding,
  onCancel,
  onDone,
}: {
  assetType: string;
  holding?: Holding;
  onCancel: () => void;
  onDone: () => void;
}) {
  const isEdit = !!holding;

  async function handleSubmit(formData: FormData) {
    if (isEdit) {
      await updateHolding(formData);
    } else {
      await addHolding(formData);
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="px-4 py-3 bg-accent/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {isEdit ? "編集" : "新規追加"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input type="hidden" name="assetType" value={assetType} />
      {isEdit && <input type="hidden" name="id" value={holding.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          name="name"
          required
          defaultValue={holding?.name ?? ""}
          placeholder="名称（必須）"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <select
          name="account"
          defaultValue={holding?.account ?? ""}
          className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:border-ring focus:outline-none"
        >
          {ACCOUNTS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <input
          name="code"
          defaultValue={holding?.code ?? ""}
          placeholder="コード（任意）"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <input
          name="marketValue"
          type="number"
          step="1"
          defaultValue={holding?.marketValue ?? ""}
          placeholder="評価額（円）"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <input
          name="costBasis"
          type="number"
          step="1"
          defaultValue={holding?.costBasis ?? ""}
          placeholder="投資額（円）"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
      </div>
      <input
        name="memo"
        defaultValue={holding?.memo ?? ""}
        placeholder="メモ（任意）"
        className="h-8 w-full rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
      />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
        >
          {isEdit ? "更新" : "追加"}
        </button>
      </div>
    </form>
  );
}

// ── レーダーチャート ──

const scoreDesc: Record<string, string> = {
  "分散度": "資産クラスの偏りの少なさ",
  "リターン": "投資額に対する損益率",
  "安定性": "現金・債券・年金・保険の比率",
  "成長性": "株式・投信・暗号資産の比率",
  "インカム": "配当・分配が期待できる資産",
  "流動性": "即換金可能な資産の比率",
};

function PortfolioRadar({
  items,
}: {
  items: { label: string; score: number; max: number }[];
}) {
  const n = items.length;
  const cx = 160;
  const cy = 150;
  const r = 100;
  const labelR = r + 28;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const px = (i: number, radius: number) => cx + radius * Math.cos(angle(i));
  const py = (i: number, radius: number) => cy + radius * Math.sin(angle(i));

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const points = items
    .map((item, i) => {
      const pct = item.max > 0 ? item.score / item.max : 0;
      return `${px(i, r * pct)},${py(i, r * pct)}`;
    })
    .join(" ");

  return (
    <div className="flex justify-center">
      <svg width={320} height={300} className="overflow-visible">
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
          fill="rgb(16 185 129 / 0.15)"
          stroke="rgb(16 185 129)"
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
              r={3.5}
              fill="rgb(16 185 129)"
            />
          );
        })}
        {/* ラベル */}
        {items.map((item, i) => {
          const lx = px(i, labelR);
          const ly = py(i, labelR);
          const anchor =
            Math.abs(lx - cx) < 5 ? "middle" : lx > cx ? "start" : "end";
          const desc = scoreDesc[item.label] ?? "";
          return (
            <g key={i}>
              <text
                x={lx}
                y={ly - 7}
                textAnchor={anchor}
                dominantBaseline="central"
                className="fill-foreground"
                fontSize={11}
                fontWeight={600}
              >
                {item.label} {item.score}
              </text>
              <text
                x={lx}
                y={ly + 7}
                textAnchor={anchor}
                dominantBaseline="central"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {desc}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
