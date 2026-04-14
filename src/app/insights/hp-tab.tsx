"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type DailySummary = {
  date: string;
  uniqueUsers: number;
  pageviews: number;
};

type PageData = {
  pageTitle: string | null;
  pageUrl: string | null;
  totalPv: number;
};

type DailyPageData = {
  date: string;
  pageTitle: string | null;
  pageUrl: string | null;
  pageviews: number;
};

type TrafficData = {
  source: string | null;
  medium: string | null;
  totalUu: number;
  totalPv: number;
};

type DeviceData = {
  deviceType: string;
  totalUu: number;
  totalPv: number;
};

type RegionData = {
  region: string;
  totalUu: number;
  totalPv: number;
};

const trendConfig = {
  uniqueUsers: { label: "訪問者数", color: "var(--chart-1)" },
  pageviews: { label: "閲覧数", color: "var(--chart-2)" },
} satisfies ChartConfig;

const pagePvConfig = {
  pv: { label: "PV", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function HpTab({
  dailySummary,
  topPages,
  dailyPages,
  traffic,
  devices,
  regions,
}: {
  dailySummary: DailySummary[];
  topPages: PageData[];
  dailyPages: DailyPageData[];
  traffic: TrafficData[];
  devices: DeviceData[];
  regions: RegionData[];
}) {
  const latest = dailySummary[dailySummary.length - 1];
  const prev = dailySummary[dailySummary.length - 2];

  const uuDiff = latest && prev ? latest.uniqueUsers - prev.uniqueUsers : 0;
  const pvDiff = latest && prev ? latest.pageviews - prev.pageviews : 0;

  const avgUu =
    dailySummary.length > 0
      ? Math.round(
          dailySummary.reduce((s, d) => s + d.uniqueUsers, 0) /
            dailySummary.length
        )
      : 0;
  const avgPv =
    dailySummary.length > 0
      ? Math.round(
          dailySummary.reduce((s, d) => s + d.pageviews, 0) /
            dailySummary.length
        )
      : 0;

  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(
    topPages[0]?.pageUrl ?? null
  );

  // Build daily PV data for the selected page
  const dates = [...new Set(dailyPages.map((d) => d.date))].sort();
  const selectedPageDaily = dates.map((date) => {
    const match = dailyPages.find(
      (dp) => dp.date === date && dp.pageUrl === selectedPageUrl
    );
    return { date, pv: match?.pageviews ?? 0 };
  });

  const selectedPageTitle = topPages.find(
    (p) => p.pageUrl === selectedPageUrl
  )?.pageTitle;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="最新 訪問者数"
          value={latest?.uniqueUsers ?? 0}
          diff={uuDiff}
        />
        <SummaryCard
          label="最新 閲覧数"
          value={latest?.pageviews ?? 0}
          diff={pvDiff}
        />
        <SummaryCard label="平均 訪問者数" value={avgUu} />
        <SummaryCard label="平均 閲覧数" value={avgPv} />
      </div>

      {/* Trend chart */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          訪問者数 / 閲覧数の推移
        </h3>
        <ChartContainer config={trendConfig} className="h-[250px] w-full">
          <AreaChart data={dailySummary}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="uniqueUsers"
              stroke="var(--color-uniqueUsers)"
              fill="var(--color-uniqueUsers)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pageviews"
              stroke="var(--color-pageviews)"
              fill="var(--color-pageviews)"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Page list + PV chart */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Page list */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            ページ別
          </h3>
          <div className="divide-y divide-border">
            {topPages.map((page, i) => {
              const title = page.pageTitle
                ? page.pageTitle.replace(/ \| エニデジ合同会社$/, "").replace(/ \| AnyDigi LLC$/, "")
                : "(no title)";
              const isSelected = page.pageUrl === selectedPageUrl;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedPageUrl(page.pageUrl)}
                  className={`flex items-center justify-between w-full py-2.5 px-2 text-left rounded transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="text-sm truncate flex-1 min-w-0" title={title}>
                    {title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0 tabular-nums">
                    {page.totalPv}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily PV chart */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {selectedPageTitle
              ? selectedPageTitle.replace(/ \| エニデジ合同会社$/, "").replace(/ \| AnyDigi LLC$/, "")
              : "ページを選択"}{" "}
            — 日別PV推移
          </h3>
          <ChartContainer config={pagePvConfig} className="h-[250px] w-full">
            <AreaChart data={selectedPageDaily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                className="text-xs"
              />
              <YAxis className="text-xs" allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="pv"
                stroke="var(--color-pv)"
                fill="var(--color-pv)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Traffic + Devices + Regions row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Traffic sources */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            流入元
          </h3>
          <div className="space-y-2">
            {traffic.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {t.source ?? "(不明)"} / {t.medium ?? "(不明)"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    訪問者 {t.totalUu}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    閲覧 {t.totalPv}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            デバイス
          </h3>
          <div className="space-y-2">
            {devices.map((d, i) => {
              const totalPv = devices.reduce((s, x) => s + x.totalPv, 0);
              const pct =
                totalPv > 0
                  ? Math.round((d.totalPv / totalPv) * 100)
                  : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">
                      {d.deviceType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pct}% (閲覧 {d.totalPv})
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regions */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            地域別
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {regions.map((r, i) => {
              const totalPv = regions.reduce((s, x) => s + x.totalPv, 0);
              const pct =
                totalPv > 0
                  ? Math.round((r.totalPv / totalPv) * 100)
                  : 0;
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {pct}%
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      訪問者 {r.totalUu}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      閲覧 {r.totalPv}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  diff,
}: {
  label: string;
  value: number;
  diff?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {diff !== undefined && diff !== 0 && (
          <span
            className={`text-xs font-medium ${diff > 0 ? "text-emerald-500" : "text-red-500"}`}
          >
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        )}
      </div>
    </div>
  );
}
