import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: Lancers 案件検索（業種横断キーワード）2026-04-30
// keywords: 自動化, 業務効率化, Excel, LINE, 予約管理
// 業種を跨いで繰り返し現れる構造的ニーズを抽出
const newNeeds = [
  {
    title: "LINE×予約・決済・リマインドの統合需要が中小サービス業で爆発",
    summary: "バーベキュー場・サウナ・美容サロン・出張買取・Amazon物販向けLINE公式アカウント構築（30万円）など、「LINEで予約・問い合わせ・決済・リマインドを完全自動化したい」という中小サービス業の強い欲求。LINE LIFFアンケート・抽選・配信の簡易システム需要も。LINE Mini App/LIFFを業務アプリとして使い倒す層が定常化。",
    vertical: "business",
    sources: ["lancers/LINE", "lancers/予約管理", "lancers/自動化"],
    regions: ["JP"],
  },
  {
    title: "業種特化型の予約管理SaaSが業界ごとにニッチ需要を持つ",
    summary: "バーベキュー場・インドアゴルフ・サウナ・眉毛サロン・整骨院・海釣り教室・民宿・心理カウンセリングなど、業種ごとに専用予約管理システムが発注されている。汎用予約SaaSでは細部（送迎管理・港の発着時間・施術メニュー連動等）に対応できず、業界特化型の参入余地が業種数だけ存在する。",
    vertical: "business",
    sources: ["lancers/予約管理"],
    regions: ["JP"],
  },
  {
    title: "OTA連携を含む宿泊業のシステム需要（Beds24×Airbnb×Booking.com）",
    summary: "「Beds24と連携し予約情報から自動反映する清掃リスト」「OTA（Airbnb/Booking.com）同期＋自社直接予約・クレジット決済」など、宿泊業特有の業界知識が必要なシステム案件が継続発注。沖縄初Airbnb運営会社のパンフレット制作も含め、宿泊業のIT支援は業界知識×技術力の両方が必要な領域として確立。",
    vertical: "business",
    sources: ["lancers/予約管理"],
    regions: ["JP"],
  },
  {
    title: "整骨院・整体院など個人医療系SaaSが大型開発予算（500万円超）",
    summary: "「リマインド・決済・カレンダー機能搭載のオンライン予約SaaS開発」が500万〜600万円で発注。眉毛サロンの予約・顧客管理システム（ホットペッパー一本化）も30万円規模。特定業界×SaaS×継続的投資の構造が成立し、業界特化SaaSへの本気の開発投資が続いている。",
    vertical: "business",
    sources: ["lancers/予約管理"],
    regions: ["JP"],
  },
  {
    title: "CSV→Excel→グラフ化の定型業務が中小事業者で蔓延",
    summary: "「試算表CSVを自動インポート・グラフ化するExcelマクロ」が複数案件で繰り返し発注（同じ案件が複数キーワードでヒット）。会計・売上・在庫レポートを定期的にExcelで加工する文化が中小に深く根付き、BIツール導入余裕のない層がVBAで賄っている現実。",
    vertical: "business",
    sources: ["lancers/Excel", "lancers/自動化", "lancers/業務効率化"],
    regions: ["JP"],
  },
  {
    title: "Power Automate Desktop（PAD）の導入支援需要が広がりつつある",
    summary: "「200工程のExcel発注業務をPower Automateで部品化」「Zapier設定とGAS集金ガイド」など、中小企業内RPAとしてPAD・Zapier・GASが広がる。マイクロソフト純正RPAが中小に届きつつあるが、設定支援が不足している段階。",
    vertical: "business",
    sources: ["lancers/自動化", "lancers/業務効率化"],
    regions: ["JP"],
  },
  {
    title: "WebデータをExcel/VBAで自動取得する慢性需要（スクレイピング代替）",
    summary: "「Excel VBAでEdge操作してデータ取得」「WebView2活用のVBA自動取得」「YouTube API/eBay APIをExcelで叩く」など、担当者がVBAでスクレイピングする現場が大量。Pythonスクレイピングを外注する代わりに、社内で動かせるVBA形式が選ばれる事情。",
    vertical: "business",
    sources: ["lancers/Excel", "lancers/自動化"],
    regions: ["JP"],
  },
  {
    title: "アパレルEC・物販事業者の需要予測・発注自動化が900万規模で発注",
    summary: "「複数データソースから発注判断をAI分析・自動化（900,000〜1,000,000円）」がアパレル向けに発注。既存ERPでは対応できない需要予測を独自実装したい層が、AI×データ統合の高単価案件を出している。Shopify×AmazonFBA連携の在庫・出荷自動化も類似ニーズ。",
    vertical: "business",
    sources: ["lancers/自動化", "lancers/Excel"],
    regions: ["JP"],
  },
  {
    title: "DeepL APIをExcelマクロから叩く翻訳業務効率化需要",
    summary: "「DeepL APIを使用した高精度翻訳Excelマクロで商品説明をCSVから一括翻訳」が発注。商品説明の多言語展開を社内で完結させたい中小ECが、AI×レガシーUI（Excel）の組み合わせを求めている。AI翻訳を業務に組み込む典型例。",
    vertical: "business",
    sources: ["lancers/Excel"],
    regions: ["JP"],
  },
  {
    title: "業種別チラシ・LPのクリエイティブ摩耗対策需要",
    summary: "「クリエイティブ摩耗対策のリニューアル」というキーワードが明示される案件が増加（相続相談・外壁塗装・リフォーム等）。同じデザインを使い続けて反応率が落ちる構造的問題。月次・四半期でリニューアルが必要なPL構造を持つ業種でデザイナー継続案件が多数。",
    vertical: "creative",
    sources: ["lancers/LINE"],
    regions: ["JP"],
  },
  {
    title: "AI禁止のSEO記事執筆需要が単価崩壊しつつ存続",
    summary: "「seo文章作成 1記事2500円 AI禁止」「主婦向け体験談 1200〜1700字×3本で7,500円」など、SEO業界がAI生成検出に厳しくなり「AI禁止」明記が増加。人手記事の単価が崩壊（300〜500円/件のセールスコピー大量募集）しながらも需要は存続する歪み構造。",
    vertical: "creative",
    sources: ["lancers/LINE", "lancers/Excel"],
    regions: ["JP"],
  },
  {
    title: "「おしゃべり代行」業務の出現—営業電話の構造変化",
    summary: "「おしゃべり代行（Zoom相談対応）」が1件300〜400円で大量募集。営業電話を「おしゃべり代行」と呼ぶ業界変化が起きており、アウトバウンド営業がインバウンド対応に置き換わりつつある。マニュアル・トークスクリプト完備で未経験OKの低単価業務として量産されている。AIによる電話応対の代替余地が大きい。",
    vertical: "business",
    sources: ["lancers/LINE"],
    regions: ["JP"],
  },
  {
    title: "建築・工務店の工程表・見積をExcel VBAで作りたい現場",
    summary: "「ガントチャート工程表をExcelで自作する建築工事ソフト」「住宅小工事のABC見積・屋号切替機能付きVBA」など、建築・工務店業界の専用ツール需要。業界専用ソフトがないかコスト高で、現場が自社Excel/VBAで賄っている層が継続的に存在。",
    vertical: "manufacturing",
    sources: ["lancers/Excel", "lancers/業務効率化"],
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
