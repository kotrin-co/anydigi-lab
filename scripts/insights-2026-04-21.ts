import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { articles, ideaEvidence, ideaScores } from "../src/lib/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "371a7e166cbbe63b58af677905b2690223b430e30fd0a199cf4cb90276fd041a", url: "https://www.theverge.com/tldr/915176/nft-metaverse-ai-weirdos", title: "Silicon Valley has forgotten what normal people want", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T20:30:00.000Z") },
  { id: "eee5e282c884a0f530931f953e28ff6190138b5be3bc07fff6bb707380cb3563", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00001/11671/", title: "旭化成社長「ナフサ分解プラントの稼働率、もともと低く大きな変化なし」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-20T20:00:00.000Z") },
  { id: "1647fa1cb68df985375f32b0a39b5490ef0a5301391837bbc12af5199bf21d9a", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03259/040100013/", title: "BYDの軽EV、人気の「超背高ワゴン」に照準　前席前方の空間拡大", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-20T20:00:00.000Z") },
  { id: "c2e1b03e5e19b830122014f0e4c0949ec72cf34ac9303c921fc918f09262af1a", url: "https://atmarkit.itmedia.co.jp/ait/articles/2604/21/news007.html", title: "Pythonの仮想環境パスが.venvに統一される？　PEP 832が提案される", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T20:00:00.000Z") },
  { id: "323dfd8844018ccc8f0f4ae1ca5bb5993fb5f87954bf260b417b8efd962fc1c9", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03569/041600003/", title: "トヨタ、市場ニーズに応える合理化「エリア35」　売れ筋に絞って部品種削減", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-20T20:00:00.000Z") },
  { id: "5154feb124bd1b2ab85781cc02d671f80c47a8f49fa56fb7c680b447767300f3", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00050/00240/", title: "日産・ウェイブ・ウーバー、自動運転と人間の運転を組み合わせる", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-20T20:00:00.000Z") },
  { id: "1726be34f54f518931c54370ced063d88e6a34fa867204192eaea56cbd5f8c19", url: "https://techcrunch.com/2026/04/20/ai-writing-its-not-just-this-its-that-barrons/", title: "It's not just one thing — it's another thing", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T19:37:07.000Z") },
  { id: "4cb83cebe31baa770cbb773cb249a109aae87704f7faabfa1fcdf334dcbf3582", url: "https://www.theverge.com/games/914963/fortnite-ai-characters-developers-conversations", title: "Fortnite developers can make AI characters now — just don't try to date them", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T16:58:39.000Z") },
  { id: "b5d10cd06b48c619411533b71c86755f496014f653890272f0423dc2eb4f5ef2", url: "https://techcrunch.com/2026/04/20/nsa-spies-are-reportedly-using-anthropics-mythos-despite-pentagon-feud/", title: "NSA spies are reportedly using Anthropic's Mythos, despite Pentagon feud", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T16:06:21.000Z") },
  { id: "8c44fd66b80ddbb3d1001a0a020283f17a9fe751321b71cf537866c191d35c84", url: "https://techcrunch.com/2026/04/20/fermi-ceo-and-cfo-depart-texas-nuclear-power-ai/", title: "CEO and CFO suddenly depart AI nuclear power upstart Fermi", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-20T15:30:19.000Z") },
  { id: "58f64ac477000359c86af208717505f1a7d911dff3ab5b76e67ccfb8f77ea1fe", url: "https://www.publickey1.jp/blog/26/rustservorustcratesio.html", title: "Rust製ブラウザエンジンのServo、Rust公式レジストリ「Crates.io」でリリース開始。長期サポート版も提供へ", sourceName: "publickey", sourceCategory: "dx", publishedAt: new Date("2026-04-20T15:15:50.000Z") },
];

const evidenceRecords = [
  // id:1 AIエージェント耐障害性テストサービス
  { ideaId: 1, articleId: "4cb83cebe31baa770cbb773cb249a109aae87704f7faabfa1fcdf334dcbf3582", relevanceNote: "EpicがFortniteでAI NPC作成ツールを公開。「デートしようとしないで」等のガードレール実装が必要で、ゲーム領域でのAIエージェント大規模展開が安全性テスト需要を裏付ける" },
  { ideaId: 1, articleId: "b5d10cd06b48c619411533b71c86755f496014f653890272f0423dc2eb4f5ef2", relevanceNote: "米NSAがAnthropicの制限付きモデル「Mythos」を運用。高リスク環境でのAIエージェント利用拡大がテスト・品質保証の需要を強く示す" },
  // id:2 中小企業向けAI導入・内製化支援
  { ideaId: 2, articleId: "371a7e166cbbe63b58af677905b2690223b430e30fd0a199cf4cb90276fd041a", relevanceNote: "テック業界と一般ユーザーの認識ギャップを指摘。技術者の興奮と普通の人の乖離が非技術者向けAI導入支援の価値を裏付ける" },
  // id:8 製造業向けマルチモーダルAI図面解析
  { ideaId: 8, articleId: "323dfd8844018ccc8f0f4ae1ca5bb5993fb5f87954bf260b417b8efd962fc1c9", relevanceNote: "トヨタが国内外18工場で部品種・仕様削減を本格展開。AI図面解析による部品カタログの自動分類・重複検出との連携需要を示唆" },
  // id:14 AI時代の人間認証インフラ
  { ideaId: 14, articleId: "1726be34f54f518931c54370ced063d88e6a34fa867204192eaea56cbd5f8c19", relevanceNote: "AI生成文の特徴的構文パターンが確実な識別指標になるほどAIコンテンツが氾濫。人間vsAI判別の需要拡大を示す" },
];

async function main() {
  // Step 5: rerank（全アクティブアイデア再スコアリング）
  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence16件、今日もFortnite AI NPC+NSA Mythosで2件追加。エージェント安全性の実需が続伸
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業向けAI導入支援 — evidence8件、テック-一般ユーザーギャップ記事追加。安定
    { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
    // id:3 AI審査モデル構築支援 — evidence1件、4/13以降追加なし。新規シグナルなく低空飛行
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — evidence1件、4/13以降追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — evidence1件、投機的。シグナルなし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence3件、4/16以降追加なし。市場は成長中だがAnyDigi fitが低い
    { ideaId: 6, market: 7, fit: 3, timing: 7, evidence: 5 },
    // id:7 LLM Wiki型ナレッジ基盤 — evidence2件、4/15以降追加なし。概念は有望だがシグナル停滞
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence3件、トヨタAREA35追加。製造業DX需要の裏付け強化
    { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 5 },
    // id:9 MCPコネクタ構築・運用 — evidence3件、Salesforce/Cloudflare直近。MCP標準化の波は継続
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 6 },
    // id:10 AIコーディングエージェント品質保証 — evidence5件、4/17以降追加なし。市場は活況だが今日のニュースに直接の追加なし
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 7 },
    // id:11 サプライチェーンセキュリティ監査 — evidence3件、4/19以降追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 6 },
    // id:12 AIエージェント可観測性PF — evidence1件。Fortnite AI NPC大量展開は間接的にモニタリング需要を示すがevidence追加はなし
    { ideaId: 12, market: 7, fit: 5, timing: 6, evidence: 3 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件、4/16以降追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 AI時代の人間認証インフラ — evidence3件、AI文体検出記事追加。人間vsAI判別需要の裏付け強化
    { ideaId: 14, market: 7, fit: 3, timing: 7, evidence: 5 },
  ];

  const scoreResult = await db.insert(ideaScores).values(rerankScores).returning();
  console.log(`✓ ${scoreResult.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
