import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { articles } from "../src/lib/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "d8a1e31ee51da5032c19b8ed1bd8328ef914b0cbc32cddf17310fed90103af35", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news127.html", title: "アスリートの姿勢をAIで推定、スノボ空中技のメカニズムを分析　Google Cloudが冬季五輪米国代表に提供", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T11:00:00.000Z") },
  { id: "ebe82643ac57755cc061ef6868c263a769aeae1806db2b892634f90fac997676", url: "https://importai.substack.com/p/import-ai-453-breaking-ai-agents", title: "Import AI 453: Breaking AI agents; MirrorCode; and ten views on gradual disempowerment", sourceName: "import_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T10:02:22.000Z") },
  { id: "51d9905e81572b37e6ce55ee75266486b61f784981ae77235fb771dd6654bdf6", url: "https://www.technologyreview.com/2026/04/13/1135156/job-titles-wildlife-first-responder-wesley-sarmento/", title: "Job titles of the future: Wildlife first responder", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-13T10:00:00.000Z") },
  { id: "c74d910e4d876736972a402846217a52e0ac24fee6ff256ae78088ffe4d13bd5", url: "https://www.technologyreview.com/2026/04/13/1135162/uri-maoz-does-free-will-exist/", title: "You have no choice in reading this article—maybe", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-13T10:00:00.000Z") },
  { id: "4c653e124ea1acd88b6958313a731ca2a3e2d7e23c1b2dca39f1f37dc8bf019e", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news122.html", title: "奈良県、\"AIアニメ\"で観光PR　約1カ月で完成、気を付けたポイントは", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T09:52:00.000Z") },
  { id: "3bd16c88106605c5476bbeeeba1010571678d4da221c0dc42d8863788c429035", url: "https://www.theverge.com/ai-artificial-intelligence/910890/openai-sam-altman-second-home-attack-shooting", title: "Sam Altman reportedly targeted in second attack", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T09:25:57.000Z") },
  { id: "18ad2c423036fb12601486849e3b8c0db201c7782d42b6b0a1f7251a42a74cc4", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news116.html", title: "最短30秒でローン審査「AI審査モデル」、PKSHAとクレディセゾンが開発", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T08:11:00.000Z") },
  { id: "54b617355ac9704b7f7f28e3786799c550441348192d3f522f55f962c4ef49d1", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news114.html", title: "さくらインターネット、約38億円の「AI向け案件」受注　国立機関から", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T08:06:00.000Z") },
  { id: "6642241cbe18bf93b6ebfd2202ac221a2516362429971a62ed8982c42dd2e3c7", url: "https://techcrunch.com/2026/04/13/the-largest-orbital-compute-cluster-is-open-for-business/", title: "The largest orbital compute cluster is open for business", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T07:01:00.000Z") },
  { id: "f80cdf03a0d86cd592353ee2a571f1e92db8f15d17d7d3a01c252334d8480037", url: "https://www.itmedia.co.jp/news/articles/2604/13/news104.html", title: "サム・アルトマン氏の自宅に銃撃か、男女2人逮捕　地元紙報道　火炎瓶投げ込み事件から間を置かず", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T06:33:00.000Z") },
  { id: "c29a624b48d12003dcf424456ea717fec1db41e157aeb95ef818969dd4f0065a", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news089.html", title: "「Claude Code」全社員に義務づけたら……コーディング経験ゼロの86％がデプロイ達成　グッドパッチが成果を公開", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T05:06:00.000Z") },
  { id: "b1064688f5fe3d7982cfa37f30c4ce71c4f9f520c716765e74f1c301b9e738cb", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news086.html", title: "日本コロムビアG、「AIアニメ」コンテストを開催　賞金総額1000万円", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T04:47:00.000Z") },
  { id: "6d6ac46a53aee32f5a116f411a2a046923b6fd8b794967727fe04ec41e76c7fa", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news084.html", title: "ソフトバンクなどAI基盤モデル開発の新会社設立か　1兆パラメーター規模モデルでフィジカルAI開発目指すと報道", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T03:59:00.000Z") },
  { id: "59ac519d8c9ea2104fc6210342ab57933fc1f842fcec4a9c2f24c4fa7c79cc65", url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news079.html", title: "\"首無し\"の人型ロボ、時速36kmで走る　「世界王者レベル」うたう、中国Unitree", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-13T03:10:00.000Z") },
];

async function main() {
  const result = await db.insert(articles).values(bqArticles).onConflictDoNothing().returning();
  console.log(`✓ ${result.length} articles synced to Neon`);
}

main().catch(console.error);
