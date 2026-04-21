import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { articles, ideaEvidence } from "../src/lib/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "b190f3d53f6a8e8821f8fba8894ccbd11dd3c9194c11c4f74bace4e256cada34", url: "https://techcrunch.com/2026/04/19/openais-existential-questions/", title: "OpenAI's existential questions", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-19T21:24:06.000Z") },
  { id: "741fcd899a1b35c2804e5a8df2adcacd77f2d802488c255a3cf6d90918744da5", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03259/040100012/", title: "BYD参入、軽電動化は大競争時代へ　スズキ・ダイハツ「HEVも武器に」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-19T20:00:00.000Z") },
  { id: "e995705c0f428ed6d1f36c55c0ac5a64dbce266ce47c16c5175301a7059d3e00", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03562/041000004/", title: "ネオジム磁石における需給ギャップ、二大課題と5つの解決ポイント", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-19T20:00:00.000Z") },
  { id: "9cdcc5717e96cf1b927e76d9489b75c90b1fcd4717c15bb178e4fc32250a1b2f", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03584/041400002/", title: "国内24社が策定「ものづくり情報標準モデル」、ハノーバーメッセで発信", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-19T20:00:00.000Z") },
  { id: "0d1403fb03754fcd8cb35e14a27d723be47b8559f4dfc2d60c11e6b39c5318cf", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03569/040100001/", title: "トヨタ、部品種・仕様のさらなる削減へ　狙いは「工場の生産能力増強」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-19T20:00:00.000Z") },
  { id: "ce8ca2693c2394f04f6d07b6bb5f36de436690bde8e685eb364ea920a4a67c91", url: "https://www.theverge.com/tech/914723/vercel-hacked", title: "Cloud development platform Vercel was hacked", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-19T19:54:52.000Z") },
  { id: "0611c46cc2ebeb4e5baba9475b74d832ba2e14a67eea37470ee9d9719b892a86", url: "https://techcrunch.com/2026/04/19/the-12-month-window/", title: "The 12-month window", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-19T19:30:00.000Z") },
  { id: "153b7ea189504cda4627774bba6dd031ed0b2098420abf76a20f19b9f8b488b8", url: "https://techcrunch.com/2026/04/19/palantir-posts-mini-manifesto-denouncing-regressive-and-harmful-cultures/", title: "Palantir posts mini-manifesto denouncing inclusivity and 'regressive' cultures", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-19T16:30:00.000Z") },
  { id: "dc106413578ce7a6f1b96cfd79903b08af2ad686eb04a59d934807a519d7f561", url: "https://techcrunch.com/2026/04/19/techcrunch-mobility-uber-enters-its-assetmaxxing-era/", title: "TechCrunch Mobility: Uber enters its assetmaxxing era", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-19T16:01:00.000Z") },
  { id: "cf18b975fd791f7981452d019ce10e133313fb4aef1cb219f3932cd572897f1e", url: "https://www.publickey1.jp/blog/26/cloudflareaicloudflare_artifactsgitrestful_api.html", title: "Cloudflare、AIエージェント用のファイルシステム「Cloudflare Artifacts」発表。Git対応バージョン管理とRESTful API対応のファイルシステム", sourceName: "publickey", sourceCategory: "dx", publishedAt: new Date("2026-04-19T15:41:28.000Z") },
  { id: "6a256ba3a511db89709f7cae8d6ac414208bf87ed8b040efc30d965912655165", url: "https://www.publickey1.jp/blog/26/cloudflareaicloudflare_email_service.html", title: "Cloudflare、AIエージェントがメールの送受信を行える「Cloudflare Email Service」パブリックベータで公開", sourceName: "publickey", sourceCategory: "dx", publishedAt: new Date("2026-04-19T15:40:07.000Z") },
  { id: "41b6116b7181fea36e47c771c77a674fb2b8d9c9490712823ed275c9ef53fc54", url: "https://www.publickey1.jp/blog/26/salesforceapiclimcpsalesforce_headless_360.html", title: "ヘッドレスなSalesforce登場、あらゆる機能がAPI/CLI/MCPでアクセスできる「Salesforce Headless 360」発表", sourceName: "publickey", sourceCategory: "dx", publishedAt: new Date("2026-04-19T15:35:59.000Z") },
];

const evidenceRecords = [
  // id:1 AIエージェント耐障害性テストサービス
  { ideaId: 1, articleId: "ce8ca2693c2394f04f6d07b6bb5f36de436690bde8e685eb364ea920a4a67c91", relevanceNote: "Vercelが「compromised third-party AI tool」経由でハッキングされた。AIツールが攻撃ベクトルとなる実例が現実化し、エージェントの安全性テスト需要を強く裏付ける" },
  { ideaId: 1, articleId: "6a256ba3a511db89709f7cae8d6ac414208bf87ed8b040efc30d965912655165", relevanceNote: "CloudflareがAIエージェント用メール送受信サービスを公開。エージェントの行動範囲拡大＝テストすべき攻撃面の拡大を示す" },
  // id:9 MCPコネクタ構築・運用サービス
  { ideaId: 9, articleId: "41b6116b7181fea36e47c771c77a674fb2b8d9c9490712823ed275c9ef53fc54", relevanceNote: "SalesforceがAPI/CLI/MCPで全機能アクセス可能な「Headless 360」を発表。大手SaaSのMCP採用がMCPの業界標準化を加速させる" },
  { ideaId: 9, articleId: "cf18b975fd791f7981452d019ce10e133313fb4aef1cb219f3932cd572897f1e", relevanceNote: "CloudflareがAIエージェント用Git互換ファイルシステム「Artifacts」を発表。エージェント基盤インフラの急速な充実がMCPエコシステム拡大を示す" },
  // id:11 サプライチェーンセキュリティ監査
  { ideaId: 11, articleId: "ce8ca2693c2394f04f6d07b6bb5f36de436690bde8e685eb364ea920a4a67c91", relevanceNote: "Vercelハック事例で「compromised third-party AI tool」が攻撃経路に。AIツール自体がサプライチェーン攻撃の新たなベクトルとなることを実証" },
  // id:8 製造業向けマルチモーダルAI図面解析
  { ideaId: 8, articleId: "9cdcc5717e96cf1b927e76d9489b75c90b1fcd4717c15bb178e4fc32250a1b2f", relevanceNote: "国内24社が製造業情報標準モデル（リーンPLM）をハノーバーメッセで発信。製造業の情報デジタル化・標準化の機運が高まり、AI図面解析との連携需要を示唆" },
];

async function main() {
  // Step 2: 記事を Neon に同期
  const articleResult = await db.insert(articles).values(bqArticles).onConflictDoNothing().returning();
  console.log(`✓ ${articleResult.length} articles synced to Neon`);

  // Step 4: エビデンス追加
  const evidenceResult = await db.insert(ideaEvidence).values(evidenceRecords).returning();
  console.log(`✓ ${evidenceResult.length} evidence records added`);

  console.log("\nDone!");
}

main().catch(console.error);
