"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { calcValueScore } from "@/lib/trade/valuation";

type Stock = {
  id: number;
  code: string;
  name: string;
  market: string | null;
  industry: string | null;
  price: number | null;
  yieldPct: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  rank: number | null;
  disqualified: boolean | null;
  disqualifiedReason: string | null;
  specialDividendSuspected: boolean | null;
  tier: string | null;
  financialScore: number | null;
  valuationScore: number | null;
  industryScore100: number | null;
  compositeScore: number | null;
};

type SortKey = "financialScore" | "yieldPct" | "price" | "pbr" | "per";

export function StockTable({ stocks }: { stocks: Stock[] }) {
  const [filter, setFilter] = useState<"all" | "S" | "A" | "B" | "C">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("financialScore");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (filter !== "all" && s.tier !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.includes(q);
      }
      return true;
    });
  }, [stocks, filter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortAsc ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
  }, [filtered, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="銘柄名・コードで検索"
            className="h-8 w-full sm:w-48 rounded-md border border-border bg-card pl-3 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "S", "A", "B", "C"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                filter === f
                  ? f === "S"
                    ? "bg-emerald-500/10 text-emerald-500 font-medium"
                    : f === "A"
                      ? "bg-blue-500/10 text-blue-500 font-medium"
                      : f === "B"
                        ? "bg-yellow-500/10 text-yellow-500 font-medium"
                        : f === "C"
                          ? "bg-muted text-foreground font-medium"
                          : "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {f === "all" ? "すべて" : `Tier ${f}`}
            </button>
          ))}
        </div>
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {sorted.length}件
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                銘柄
              </th>
              <SortTh label="株価" sortKey="price" current={sortKey} asc={sortAsc} onClick={handleSort} />
              <SortTh label="利回り" sortKey="yieldPct" current={sortKey} asc={sortAsc} onClick={handleSort} />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Tier
              </th>
              <SortTh label="財務" sortKey="financialScore" current={sortKey} asc={sortAsc} onClick={handleSort} />
              <SortTh label="PER" sortKey="per" current={sortKey} asc={sortAsc} onClick={handleSort} className="hidden sm:table-cell" />
              <SortTh label="PBR" sortKey="pbr" current={sortKey} asc={sortAsc} onClick={handleSort} className="hidden sm:table-cell" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                ROE
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                割安度
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock) => (
              <StockRow key={stock.id} stock={stock} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortTh({
  label,
  sortKey,
  current,
  asc,
  onClick,
  className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onClick: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className={`px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none ${className ?? ""}`}
      onClick={() => onClick(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-foreground">{asc ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );
}

// ── 業種カテゴリ色分け ──

const industryCategory: Record<string, { label: string; color: string }> = {};
const categoryDef: { label: string; color: string; industries: string[] }[] = [
  { label: "IT・通信", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", industries: ["情報・通信業", "サービス業"] },
  { label: "製造", color: "bg-violet-500/10 text-violet-500 border-violet-500/30", industries: ["機械", "電気機器", "輸送用機器", "精密機器", "その他製品"] },
  { label: "素材", color: "bg-amber-500/10 text-amber-500 border-amber-500/30", industries: ["化学", "鉄鋼", "非鉄金属", "金属製品", "ゴム製品", "ガラス・土石製品", "石油・石炭製品"] },
  { label: "金融", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", industries: ["銀行業", "証券、商品先物取引業", "保険業", "その他金融業"] },
  { label: "商社・小売", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30", industries: ["卸売業", "小売業"] },
  { label: "建設・不動産", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", industries: ["建設業", "不動産業"] },
  { label: "インフラ・運輸", color: "bg-pink-500/10 text-pink-500 border-pink-500/30", industries: ["陸運業", "海運業", "空運業", "倉庫・運輸関連", "電気・ガス業"] },
  { label: "生活", color: "bg-lime-500/10 text-lime-500 border-lime-500/30", industries: ["食料品", "医薬品", "繊維製品", "パルプ・紙", "水産・農林業"] },
];
for (const cat of categoryDef) {
  for (const ind of cat.industries) {
    industryCategory[ind] = { label: cat.label, color: cat.color };
  }
}
const defaultCategory = { label: "その他", color: "bg-muted text-muted-foreground border-border" };

function IndustryBadge({ industry }: { industry: string | null }) {
  if (!industry) return <span className="text-xs text-muted-foreground">—</span>;
  const cat = industryCategory[industry] ?? defaultCategory;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${cat.color}`}>
      {industry}
    </span>
  );
}

const tierStyle: Record<string, string> = {
  S: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  A: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  B: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  C: "bg-muted text-muted-foreground border-border",
};

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tierStyle[tier] ?? tierStyle.C}`}>
      {tier}
    </span>
  );
}

function ValuationLabel({ roe, pbr }: { roe: number | null; pbr: number | null }) {
  const vs = calcValueScore(roe, pbr);
  if (!vs) return <span className="text-xs text-muted-foreground">—</span>;
  return <span className={`text-xs font-medium ${vs.color}`}>{vs.label}</span>;
}

function ScoreBar({ value, color }: { value: number | null; color: string }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{value}</span>
    </div>
  );
}

function StockRow({ stock }: { stock: Stock }) {
  const tier = stock.tier;
  const isTierDetail = tier === "S" || tier === "A";
  const detailHref = isTierDetail
    ? `/trade/jp-high-dividend/tier-${tier.toLowerCase()}`
    : undefined;

  const nameContent = (
    <div>
      <span className="font-medium text-foreground">{stock.name}</span>
      <span className="ml-2 text-xs font-mono text-muted-foreground">
        {stock.code}
      </span>
      <div className="mt-0.5">
        <IndustryBadge industry={stock.industry} />
      </div>
    </div>
  );

  return (
    <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors">
      <td className="px-3 py-2.5">
        {detailHref ? (
          <Link href={detailHref} className="hover:underline">
            {nameContent}
          </Link>
        ) : (
          nameContent
        )}
      </td>
      <td className="px-3 py-2.5 font-mono text-foreground">
        {stock.price ? `¥${stock.price.toLocaleString()}` : "—"}
      </td>
      <td className="px-3 py-2.5 font-mono">
        <span className="font-semibold text-emerald-500">
          {stock.yieldPct?.toFixed(2)}%
        </span>
      </td>
      <td className="px-3 py-2.5">
        <TierBadge tier={stock.tier} />
      </td>
      <td className="px-3 py-2.5">
        <ScoreBar value={stock.financialScore} color="bg-violet-500" />
      </td>
      <td className="px-3 py-2.5 hidden sm:table-cell font-mono text-xs text-foreground">
        {stock.per ? `${stock.per.toFixed(1)}倍` : "—"}
      </td>
      <td className="px-3 py-2.5 hidden sm:table-cell font-mono text-xs text-foreground">
        {stock.pbr ? `${stock.pbr.toFixed(2)}倍` : "—"}
      </td>
      <td className="px-3 py-2.5 hidden sm:table-cell font-mono text-xs text-foreground">
        {stock.roe ? `${stock.roe.toFixed(1)}%` : "—"}
      </td>
      <td className="px-3 py-2.5 hidden md:table-cell">
        <ValuationLabel roe={stock.roe} pbr={stock.pbr} />
      </td>
    </tr>
  );
}
