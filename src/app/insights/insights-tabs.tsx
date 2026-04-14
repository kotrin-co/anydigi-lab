"use client";

import { ExternalLink } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { HpTab } from "./hp-tab";

type Idea = {
  id: number;
  title: string;
  summary: string;
  category: string;
  createdAt: Date;
  market: number | null;
  fit: number | null;
  timing: number | null;
  evidence: number | null;
};

type Evidence = {
  articleTitle: string;
  relevanceNote: string | null;
  sourceName: string;
};

type Article = {
  id: string;
  url: string;
  title: string;
  sourceName: string;
  sourceCategory: string | null;
  publishedAt: Date | null;
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

type HpData = {
  dailySummary: { date: string; uniqueUsers: number; pageviews: number }[];
  topPages: { pageTitle: string | null; pageUrl: string | null; totalPv: number }[];
  dailyPages: { date: string; pageTitle: string | null; pageUrl: string | null; pageviews: number }[];
  traffic: { source: string | null; medium: string | null; totalUu: number; totalPv: number }[];
  devices: { deviceType: string; totalUu: number; totalPv: number }[];
  regions: { region: string; totalUu: number; totalPv: number }[];
};

export function InsightsTabs({
  anydigiIdeas,
  generalIdeas,
  recentArticles,
  evidenceByIdea,
  hpData,
}: {
  anydigiIdeas: Idea[];
  generalIdeas: Idea[];
  recentArticles: Article[];
  evidenceByIdea: Record<number, Evidence[]>;
  hpData: HpData;
}) {
  return (
    <Tabs defaultValue="anydigi">
      <TabsList>
        <TabsTrigger value="anydigi">
          AnyDigi
          <span className="ml-1.5 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-500">
            {anydigiIdeas.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="general">
          General
          <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
            {generalIdeas.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="articles">
          Articles
          <span className="ml-1.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
            {recentArticles.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="hp">
          HP
        </TabsTrigger>
      </TabsList>

      <TabsContent value="anydigi">
        {anydigiIdeas.length > 0 ? (
          <div className="grid gap-4">
            {anydigiIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                evidence={evidenceByIdea[idea.id] ?? []}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="AnyDigi事業アイデアはまだありません" />
        )}
      </TabsContent>

      <TabsContent value="general">
        {generalIdeas.length > 0 ? (
          <div className="grid gap-4">
            {generalIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                evidence={evidenceByIdea[idea.id] ?? []}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="一般事業アイデアはまだありません" />
        )}
      </TabsContent>

      <TabsContent value="articles">
        {recentArticles.length > 0 ? (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {recentArticles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {article.sourceName}
                    </span>
                    {article.publishedAt && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(article.publishedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
              </a>
            ))}
          </div>
        ) : (
          <EmptyState message="記事はまだありません" />
        )}
      </TabsContent>

      <TabsContent value="hp">
        <HpTab
          dailySummary={hpData.dailySummary}
          topPages={hpData.topPages}
          dailyPages={hpData.dailyPages}
          traffic={hpData.traffic}
          devices={hpData.devices}
          regions={hpData.regions}
        />
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function IdeaCard({ idea, evidence }: { idea: Idea; evidence: Evidence[] }) {
  const totalScore =
    (idea.market ?? 0) +
    (idea.fit ?? 0) +
    (idea.timing ?? 0) +
    (idea.evidence ?? 0);

  const scores = [
    { label: "Market", value: idea.market, color: "bg-blue-500" },
    { label: "Fit", value: idea.fit, color: "bg-violet-500" },
    { label: "Timing", value: idea.timing, color: "bg-amber-500" },
    { label: "Evidence", value: idea.evidence, color: "bg-emerald-500" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {idea.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {idea.summary}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
          {totalScore}/40
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {scores.map((score) => (
          <div key={score.label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">
              {score.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${score.color}`}
                style={{ width: `${((score.value ?? 0) / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-4 text-right">
              {score.value ?? "–"}
            </span>
          </div>
        ))}
      </div>

      {evidence.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">
            Evidence ({evidence.length})
          </span>
          {evidence.map((e, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground pl-3 border-l-2 border-border"
            >
              <span className="text-foreground">{e.articleTitle}</span>
              {e.relevanceNote && (
                <>
                  <span className="mx-1">—</span>
                  {e.relevanceNote}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {formatDate(idea.createdAt)}
      </div>
    </div>
  );
}
