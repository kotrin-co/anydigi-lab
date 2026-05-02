import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: Reddit hot posts 2026-04-30
// (r/startups, r/Entrepreneur, r/smallbusiness, r/SideProject, r/sales,
//  r/FoodBusiness, r/Restauranteur, r/artificial, r/MachineLearning, r/LocalLLaMA, r/japan, r/japanlife)
const newNeeds = [
  {
    title: "B2Bアウトリーチ手段が全滅しつつある",
    summary: "メールはスパムフィルターで届かない、LinkedInはメッセージが埋もれる、コールドコールも嫌われる。営業担当者が「どのチャネルも機能しなくなった」と感じており、新たなリーチ手段への需要が急増。r/salesで325pt/353コメントの高共感投稿「Outreach is dead」ほか複数スレッドで同テーマが浮上。",
    vertical: "business",
    sources: ["reddit/sales", "reddit/Entrepreneur"],
    regions: ["US"],
  },
  {
    title: "SaaSツール乱立によるデータ断絶とロックイン",
    summary: "HubSpot・Zendesk・Stripeに分散したデータを横断クエリするためにエンジニア3人・1週間が必要。「自社で入力したデータを自社でクエリできない」という不満。SalesforceのコストがSMBにとって致命的になっている。データ主権の回復・SaaS乗り換えへのニーズが顕在化。",
    vertical: "business",
    sources: ["reddit/Entrepreneur", "reddit/smallbusiness"],
    regions: ["US", "EU"],
  },
  {
    title: "ソロビルダー・個人開発者の集客力不足",
    summary: "「作ることはできる、でも見つけてもらえない」という壁。3年かけてSaaSを作り11人の有料ユーザーを獲得しても成長が止まる。r/Entrepreneurで「I can build things. I cannot make people discover them」が44pt/101コメント。ディストリビューションが製品より重要という認識が広がる。",
    vertical: "startup",
    sources: ["reddit/Entrepreneur", "reddit/SideProject", "reddit/startups"],
    regions: ["US", "EU"],
  },
  {
    title: "AIの普及でバイヤーが営業前に90%の意思決定を完了する",
    summary: "LLMを使って製品比較・欠点・競合分析が購買前に完結し、営業担当者が「情報ゲートキーパー」という従来の役割を失いつつある。r/salesで「The buying process is drastically changing」が61pt。特に2026年に入って顕著という証言あり。",
    vertical: "business",
    sources: ["reddit/sales"],
    regions: ["US"],
  },
  {
    title: "非技術系創業者がAIで全機能を一気に実装して失敗する",
    summary: "AIで「アイデア→フル機能プロダクト」を一気に作れるようになったことで、コア機能を絞らずに作り過ぎて後で問題が噴出するケースが急増。r/startupsで「What I've learned watching non-technical founders build with AI」が68pt/65コメント。コア1機能に集中した設計が生き残る。",
    vertical: "startup",
    sources: ["reddit/startups"],
    regions: ["US"],
  },
  {
    title: "小規模サービス業（HVAC等）で現場スタッフが小物部材を請求し忘れる",
    summary: "コンデンサー・PVC・冷媒など60〜40ドルの小物が請求書に載らないまま四半期で大きな損失に。スタッフは修理が得意だが書類が苦手という二律背反。請求漏れを防ぐフィールドサービス管理ツールへのニーズ。r/smallbusiness 28pt/69コメント。",
    vertical: "business",
    sources: ["reddit/smallbusiness"],
    regions: ["US"],
  },
  {
    title: "中小ビジネスのマイクロインフルエンサー施策がROIゼロ",
    summary: "12kフォロワーのインフルエンサーに€200払ってフォロワー増加ゼロ・売上ゼロという体験が多数。「エンゲージメントが高く見える」アカウントも実際の購買転換がない。真に効果的な認知獲得チャネルへの需要。r/smallbusiness 75pt/62コメント。",
    vertical: "business",
    sources: ["reddit/smallbusiness"],
    regions: ["EU"],
  },
  {
    title: "ローカルLLMはクラウドモデルに対してコーディング生産性が大幅劣後",
    summary: "Qwen 27B・Gemma 4 31Bでコーディングを試したが意思決定の質・ツール呼び出しの精度でClaude Codeと比べ明らかに劣る。プライバシー・コスト削減メリットが生産性損失で帳消しに。ローカルモデルの実用性向上への強い需要。r/LocalLLaMAで927pt/755コメントの最高共感投稿。",
    vertical: "ai",
    sources: ["reddit/LocalLLaMA"],
    regions: ["US", "EU"],
  },
  {
    title: "AIが感情サポート・セラピー代替として機能し始めている",
    summary: "「4年間のセラピーより10分のAI会話で離婚の整理ができた」という投稿がr/artificialで216pt/217コメント獲得。AIの感情サポート機能が従来のセラピーより手軽で有効という声が急増。メンタルヘルス分野でのAI活用への関心が実用段階に入っている。",
    vertical: "ai",
    sources: ["reddit/artificial"],
    regions: ["US"],
  },
  {
    title: "在日外国人が円安で帰国できなくなっている",
    summary: "米国フロリダ出身の在日者が「往復30万円・滞在費も高騰で実家帰省が年々難しくなる」と投稿。r/japanlifeで291pt/310コメントの高共感。円安が在日外国人の生活設計に深刻な影響を与えており、外貨送金・格安帰国フライト・アジア域内旅行代替などの需要がある。",
    vertical: "japan",
    sources: ["reddit/japanlife"],
    regions: ["JP"],
  },
  {
    title: "日本の就労ビザ要件変更の情報が当事者に届いていない",
    summary: "エンジニア/専門職ビザに語学要件追加（CEFR B2相当）が導入されるが移民局が告知を出しておらず「更新時に初めて知って拒否される人が続出する」という予測がr/japanlifeで291pt/195コメント。外国人向けビザ情報の正確な伝達手段への需要。",
    vertical: "japan",
    sources: ["reddit/japanlife"],
    regions: ["JP"],
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  for (const need of newNeeds) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.80);

    if (similar.length > 0) {
      const existing = similar[0];
      const existingSources: string[] = existing.sources ?? [];
      const existingRegions: string[] = (existing as any).regions ?? [];
      const mergedSources = Array.from(new Set([...existingSources, ...need.sources]));
      const mergedRegions = Array.from(new Set([...existingRegions, ...(need.regions ?? [])]));
      await db.execute(
        sql`UPDATE needradar.needs SET
          evidence_count = evidence_count + 1,
          sources = ${mergedSources},
          regions = ${mergedRegions},
          updated_at = NOW()
        WHERE id = ${existing.id}`
      );
      console.log(`↑ Updated: "${existing.title}" (id:${existing.id}, similarity:${existing.similarity.toFixed(3)})`);
      updated++;
    } else {
      const [row] = await db.insert(needs).values({
        title: need.title,
        summary: need.summary,
        vertical: need.vertical,
        sources: need.sources,
        regions: need.regions ?? [],
        embedding,
      }).returning({ id: needs.id });
      console.log(`+ Inserted: "${need.title}" (id:${row.id})`);
      inserted++;
    }
  }

  console.log(`\nDone. inserted=${inserted}, updated=${updated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
