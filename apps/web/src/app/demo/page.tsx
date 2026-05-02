import { db } from "@anydigi-lab/database/db";
import { articles } from "@anydigi-lab/database/schema/insights";
import {
  demoQuestionSets,
  type DemoTopic,
} from "@anydigi-lab/database/schema/demo";
import { desc, eq } from "drizzle-orm";
import { ChatBot } from "./chat-bot";
import { InfoPanels } from "./info-panels";

export const revalidate = 3600;

const FALLBACK_TOPICS: DemoTopic[] = [
  { label: "AI 規制と企業対応", description: "ガバナンス・リスク・各国動向" },
  { label: "生成 AI の現場活用", description: "実装事例・効率化・課題" },
  { label: "DX とデータ基盤", description: "戦略・事例・組織体制" },
  { label: "スタートアップ動向", description: "資金調達・新興プレイヤー" },
];

async function getArticles() {
  return db
    .select({
      id: articles.id,
      url: articles.url,
      title: articles.title,
      sourceName: articles.sourceName,
      sourceCategory: articles.sourceCategory,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(100);
}

async function getTodayQuestionSet() {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select({
      id: demoQuestionSets.id,
      topics: demoQuestionSets.topics,
      intro: demoQuestionSets.intro,
    })
    .from(demoQuestionSets)
    .where(eq(demoQuestionSets.generatedForDate, today))
    .limit(1);
  return row ?? null;
}

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DemoPage() {
  const [rows, questionSet] = await Promise.all([
    getArticles(),
    getTodayQuestionSet(),
  ]);

  const topics = questionSet?.topics ?? FALLBACK_TOPICS;
  const questionSetId = questionSet?.id ?? null;
  const intro = questionSet?.intro ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-600">
            AnyDigi Lab
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Live AI Pipeline
          </h1>
        </div>
        <InfoPanels />
      </div>

      <ChatBot
        questionSetId={questionSetId}
        topics={topics}
        intro={intro}
      />

      <div id="raw-data" className="space-y-2 scroll-mt-8">
        <h2 className="text-sm font-medium text-foreground">
          本日のニュース一覧
        </h2>
      </div>

      {/* Desktop: テーブル */}
      <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">公開日時</th>
              <th className="px-3 py-2 text-left font-medium">カテゴリ</th>
              <th className="px-3 py-2 text-left font-medium">ソース</th>
              <th className="px-3 py-2 text-left font-medium">タイトル</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  記事がまだありません。
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-t border-border/60 hover:bg-accent/40">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {formatDateTime(a.publishedAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {a.sourceCategory ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {a.sourceCategory}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {a.sourceName}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      {a.title}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: タイトル中心のリスト */}
      <ul className="sm:hidden divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            記事がまだありません。
          </li>
        ) : (
          rows.map((a) => (
            <li key={a.id} className="px-3 py-3">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm leading-snug text-foreground hover:underline"
              >
                {a.title}
              </a>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="tabular-nums">
                  {formatDateTime(a.publishedAt)}
                </span>
                <span>·</span>
                <span className="truncate">{a.sourceName}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
