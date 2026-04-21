import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ideaScores } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const scores = [
  // id:1 AIエージェント耐障害性テスト — Vercel hack + CF Email = evidence急増, timing↑
  { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
  // id:2 中小企業AI導入 — 変動なし
  { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
  // id:3 AI審査モデル — evidence停滞
  { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
  // id:4 自治体AI — evidence停滞
  { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
  // id:5 宇宙エッジ — evidence停滞
  { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
  // id:6 AIアニメ — 変動なし
  { ideaId: 6, market: 7, fit: 3, timing: 7, evidence: 5 },
  // id:7 LLM Wiki — 変動なし
  { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
  // id:8 製造業AI図面 — ハノーバーメッセ発信でtiming↑, evidence↑
  { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 4 },
  // id:9 MCPコネクタ — Salesforce MCP + CF Artifacts で market↑, timing↑, evidence↑
  { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 6 },
  // id:10 AIコーディング品質 — 新規evidenceなし、微調整
  { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 7 },
  // id:11 サプライチェーンセキュリティ — Vercel hack で market↑, timing↑, evidence↑
  { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 6 },
  // id:12 エージェント可観測性 — 変動なし
  { ideaId: 12, market: 7, fit: 5, timing: 6, evidence: 3 },
  // id:13 AI駆動コマース — 変動なし
  { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
  // id:14 人間認証 — 微調整
  { ideaId: 14, market: 7, fit: 3, timing: 7, evidence: 4 },
];

async function main() {
  const result = await db.insert(ideaScores).values(scores).returning();
  console.log(`✓ ${result.length} ideas rescored`);
}

main().catch(console.error);
