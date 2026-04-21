import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ideaScores } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("=== rerank 2026-04-17 ===\n");

  // 今日のトレンド:
  // - AIコーディングツール競争激化（Factory $1.5B, Codex大幅更新, Opus 4.7）
  // - AIエージェント安全性・監視市場の立ち上がり（InsightFinder $15M）
  // - サプライチェーンセキュリティ意識の高まり
  // - AIコマーストラフィック爆発的成長（+393%）
  // - AI動画制作の商業化（Luma→Prime Video）

  const scores = [
    { ideaId: 1,  market: 9, fit: 9, timing: 9, evidence: 9 },  // AIエージェント耐障害性テスト: evidence 11件、InsightFinder $15M/Codexデスクトップ拡張で市場・evidenceともに上昇
    { ideaId: 2,  market: 8, fit: 8, timing: 9, evidence: 7 },  // 中小企業AI内製化: evidence 7件、AIコーディングツール急成長で波及タイミング加速
    { ideaId: 3,  market: 6, fit: 7, timing: 6, evidence: 2 },  // AI審査モデル: 追加証拠なし、変更なし
    { ideaId: 4,  market: 5, fit: 4, timing: 6, evidence: 2 },  // 自治体AIコンテンツ: 追加証拠なし、変更なし
    { ideaId: 5,  market: 4, fit: 3, timing: 3, evidence: 1 },  // 宇宙エッジ: 追加証拠なし、変更なし
    { ideaId: 6,  market: 7, fit: 3, timing: 8, evidence: 4 },  // AIアニメ: Luma劇場品質スタジオ設立でmarket/timing上昇
    { ideaId: 7,  market: 7, fit: 8, timing: 8, evidence: 4 },  // LLM Wiki: 直接関連記事なし、変更なし
    { ideaId: 8,  market: 7, fit: 4, timing: 7, evidence: 3 },  // 製造業AI図面: 追加証拠なし、変更なし
    { ideaId: 9,  market: 7, fit: 9, timing: 8, evidence: 3 },  // MCPコネクタ: 直接関連記事なし、変更なし
    { ideaId: 10, market: 8, fit: 8, timing: 9, evidence: 6 },  // AIコーディング品質保証: 本日新規、初期スコア維持
    { ideaId: 11, market: 7, fit: 7, timing: 8, evidence: 5 },  // サプライチェーンセキュリティ: 本日新規、初期スコア維持
    { ideaId: 12, market: 8, fit: 5, timing: 9, evidence: 6 },  // AIエージェント可観測性: 本日新規、初期スコア維持
    { ideaId: 13, market: 8, fit: 4, timing: 8, evidence: 6 },  // AI駆動パーソナライズドコマース: 本日新規、初期スコア維持
  ];

  await db.insert(ideaScores).values(scores);
  console.log(`✓ ${scores.length}件のアイデアを再スコアリング完了`);

  // スコア合計でランキング表示
  const ranked = scores
    .map((s) => ({
      ...s,
      total: s.market + s.fit + s.timing + s.evidence,
    }))
    .sort((a, b) => b.total - a.total);

  console.log("\n--- ランキング ---");
  const names: Record<number, string> = {
    1: "AIエージェント耐障害性テスト",
    2: "中小企業AI内製化支援",
    3: "AI審査モデル構築支援",
    4: "自治体AIコンテンツ制作",
    5: "宇宙エッジコンピューティング",
    6: "AIアニメ制作プラットフォーム",
    7: "LLM Wikiナレッジ基盤",
    8: "製造業AI図面解析",
    9: "MCPコネクタ構築・運用",
    10: "AIコーディング品質保証",
    11: "サプライチェーンセキュリティ監査",
    12: "AIエージェント可観測性",
    13: "AI駆動パーソナライズドコマース",
  };

  ranked.forEach((s, i) => {
    console.log(
      `  ${i + 1}. [${s.total}] ${names[s.ideaId]} (M:${s.market} F:${s.fit} T:${s.timing} E:${s.evidence})`
    );
  });
}

main().catch(console.error);
