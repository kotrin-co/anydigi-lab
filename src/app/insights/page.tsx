import { db } from "@/lib/db";
import {
  ideas,
  ideaScores,
  ideaEvidence,
  articles,
  hpDailySummary,
  hpPages,
  hpTraffic,
  hpDevices,
  hpRegions,
} from "@/lib/schema/insights";
import { eq, desc, sql, asc } from "drizzle-orm";
import { InsightsTabs } from "./insights-tabs";

async function getInsightsData() {
  const latestScores = db
    .selectDistinctOn([ideaScores.ideaId], {
      ideaId: ideaScores.ideaId,
      market: ideaScores.market,
      fit: ideaScores.fit,
      timing: ideaScores.timing,
      evidence: ideaScores.evidence,
    })
    .from(ideaScores)
    .orderBy(ideaScores.ideaId, desc(ideaScores.scoredAt))
    .as("latest_scores");

  const [activeIdeas, recentArticles, evidenceRows] = await Promise.all([
    db
      .select({
        id: ideas.id,
        title: ideas.title,
        summary: ideas.summary,
        category: ideas.category,
        createdAt: ideas.createdAt,
        market: latestScores.market,
        fit: latestScores.fit,
        timing: latestScores.timing,
        evidence: latestScores.evidence,
      })
      .from(ideas)
      .leftJoin(latestScores, eq(ideas.id, latestScores.ideaId))
      .where(eq(ideas.status, "active"))
      .orderBy(
        desc(
          sql`COALESCE(${latestScores.market}, 0) + COALESCE(${latestScores.fit}, 0) + COALESCE(${latestScores.timing}, 0) + COALESCE(${latestScores.evidence}, 0)`
        )
      ),
    db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishedAt))
      .limit(30),
    db
      .select({
        ideaId: ideaEvidence.ideaId,
        articleTitle: articles.title,
        relevanceNote: ideaEvidence.relevanceNote,
        sourceName: articles.sourceName,
      })
      .from(ideaEvidence)
      .innerJoin(articles, eq(ideaEvidence.articleId, articles.id)),
  ]);

  const evidenceByIdea: Record<
    number,
    { articleTitle: string; relevanceNote: string | null; sourceName: string }[]
  > = {};
  for (const e of evidenceRows) {
    if (!evidenceByIdea[e.ideaId]) evidenceByIdea[e.ideaId] = [];
    evidenceByIdea[e.ideaId].push(e);
  }

  return { activeIdeas, recentArticles, evidenceByIdea };
}

async function getHpData() {
  const [dailySummary, topPages, dailyPages, traffic, devices, regions] = await Promise.all([
    db
      .select({
        date: hpDailySummary.date,
        uniqueUsers: hpDailySummary.uniqueUsers,
        pageviews: hpDailySummary.pageviews,
      })
      .from(hpDailySummary)
      .orderBy(asc(hpDailySummary.date)),
    db
      .select({
        pageTitle: hpPages.pageTitle,
        pageUrl: hpPages.pageUrl,
        totalPv: sql<number>`SUM(${hpPages.pageviews})::int`,
      })
      .from(hpPages)
      .groupBy(hpPages.pageTitle, hpPages.pageUrl)
      .orderBy(desc(sql`SUM(${hpPages.pageviews})`))
      .limit(10),
    db
      .select({
        date: hpPages.date,
        pageTitle: hpPages.pageTitle,
        pageUrl: hpPages.pageUrl,
        pageviews: hpPages.pageviews,
      })
      .from(hpPages)
      .orderBy(asc(hpPages.date), desc(hpPages.pageviews)),
    db
      .select({
        source: hpTraffic.source,
        medium: hpTraffic.medium,
        totalUu: sql<number>`SUM(${hpTraffic.uniqueUsers})::int`,
        totalPv: sql<number>`SUM(${hpTraffic.pageviews})::int`,
      })
      .from(hpTraffic)
      .groupBy(hpTraffic.source, hpTraffic.medium)
      .orderBy(desc(sql`SUM(${hpTraffic.uniqueUsers})`)),
    db
      .select({
        deviceType: hpDevices.deviceType,
        totalUu: sql<number>`SUM(${hpDevices.uniqueUsers})::int`,
        totalPv: sql<number>`SUM(${hpDevices.pageviews})::int`,
      })
      .from(hpDevices)
      .groupBy(hpDevices.deviceType)
      .orderBy(desc(sql`SUM(${hpDevices.uniqueUsers})`)),
    db
      .select({
        region: hpRegions.region,
        totalUu: sql<number>`SUM(${hpRegions.uniqueUsers})::int`,
        totalPv: sql<number>`SUM(${hpRegions.pageviews})::int`,
      })
      .from(hpRegions)
      .groupBy(hpRegions.region)
      .orderBy(desc(sql`SUM(${hpRegions.pageviews})`)),
  ]);

  return { dailySummary, topPages, dailyPages, traffic, devices, regions };
}

export default async function InsightsPage() {
  const [
    { activeIdeas, recentArticles, evidenceByIdea },
    hpData,
  ] = await Promise.all([getInsightsData(), getHpData()]);

  const anydigiIdeas = activeIdeas.filter((i) => i.category === "anydigi");
  const generalIdeas = activeIdeas.filter((i) => i.category === "general");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ビジネスアイデア・HPアクセス分析
        </p>
      </div>

      <InsightsTabs
        anydigiIdeas={anydigiIdeas}
        generalIdeas={generalIdeas}
        recentArticles={recentArticles}
        evidenceByIdea={evidenceByIdea}
        hpData={hpData}
      />
    </div>
  );
}
