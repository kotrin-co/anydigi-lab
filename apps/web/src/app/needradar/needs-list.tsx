"use client";

import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";

type Need = {
  id: number;
  title: string;
  summary: string;
  vertical: string;
  evidenceCount: number;
  sources: string[];
  regions: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function extractSourcePrefix(src: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return "web";
  const slashIdx = src.indexOf("/");
  if (slashIdx > 0) return src.slice(0, slashIdx);
  return src;
}

export function NeedsList({
  needs,
  verticalCounts,
  sourceCounts,
}: {
  needs: Need[];
  verticalCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
}) {
  const [activeVertical, setActiveVertical] = useState<string>("all");
  const [activeSource, setActiveSource] = useState<string>("all");

  const verticals = useMemo(() => {
    const keys = Object.keys(verticalCounts).sort(
      (a, b) => verticalCounts[b] - verticalCounts[a],
    );
    return ["all", ...keys];
  }, [verticalCounts]);

  const sources = useMemo(() => {
    const keys = Object.keys(sourceCounts).sort(
      (a, b) => sourceCounts[b] - sourceCounts[a],
    );
    return ["all", ...keys];
  }, [sourceCounts]);

  const filtered = needs.filter((n) => {
    if (activeVertical !== "all" && n.vertical !== activeVertical) return false;
    if (activeSource !== "all") {
      const prefixes = new Set(
        (n.sources ?? []).map(extractSourcePrefix).filter(Boolean) as string[],
      );
      if (!prefixes.has(activeSource)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
            縦軸
          </span>
          <div className="flex flex-wrap gap-2">
            {verticals.map((v) => (
              <button
                key={v}
                onClick={() => setActiveVertical(v)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeVertical === v
                    ? "border-border bg-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {v === "all" ? "すべて" : v}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {v === "all" ? needs.length : verticalCounts[v]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
            情報源
          </span>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSource(s)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSource === s
                    ? "border-border bg-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {s === "all" ? "すべて" : s}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {s === "all" ? needs.length : sourceCounts[s]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">ニーズがありません</p>
        </div>
      )}
    </div>
  );
}

function NeedCard({ need }: { need: Need }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {need.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {need.summary}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
          ev {need.evidenceCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[11px] font-medium">
          {need.vertical}
        </span>
        {need.regions.map((r) => (
          <span
            key={r}
            className="rounded-md bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[11px] font-medium"
          >
            {r}
          </span>
        ))}
      </div>

      {need.sources.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-muted-foreground">
            Sources ({need.sources.length})
          </span>
          <div className="space-y-1">
            {need.sources.slice(0, 5).map((src, i) => {
              const isUrl = /^https?:\/\//.test(src);
              return isUrl ? (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground truncate pl-3 border-l-2 border-border"
                >
                  <span className="truncate">{src}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <div
                  key={i}
                  className="text-xs text-muted-foreground truncate pl-3 border-l-2 border-border"
                >
                  {src}
                </div>
              );
            })}
            {need.sources.length > 5 && (
              <span className="text-xs text-muted-foreground pl-3">
                +{need.sources.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {formatDate(need.updatedAt)}
      </div>
    </div>
  );
}
