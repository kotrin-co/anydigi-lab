import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: Lancers 案件検索 2026-04-30
// keywords: 食品, 飲食店, 製造業, 卸売, 地方創生, 食品工場, HACCP, 受発注, 生産管理, トレーサビリティ
// 中川の強み領域（食品×製造業×現場×レガシー脱却）に紐付くニーズを抽出
const newNeeds = [
  {
    title: "食品工場のHACCP対応書類・運用が中小事業者の重い負担になっている",
    summary: "2021年HACCP義務化以降、中小食品工場が書類作成・運用に困窮し続けている。HACCP書類作成代行サービス・対応コンサル・解説記事・e-learning動画が継続発注。法令×現場×書類の三拍子が必要でIT屋単体では入れない。Lancersで「ハサップ作成代行プロくまもと」「HACCP PASSアプリ」「HACCP Laboロゴ」「飲食店HACCP情報サイト」など派生サービスのブランディング案件が多数。",
    vertical: "food",
    sources: ["lancers/食品工場", "lancers/HACCP"],
    regions: ["JP"],
  },
  {
    title: "食品工場の外国人技能実習生向け衛生・業務教育コンテンツの恒常的需要",
    summary: "食品衛生・ビジネスマナーのe-learning動画8時間分で500,000〜600,000円という高単価発注。多言語対応×業界特化×わかりやすさが同時に求められる。技能実習生に依存する食品加工業の構造的需要で、外国人労働者向け教育コンテンツが今後も拡大する見込み。",
    vertical: "food",
    sources: ["lancers/食品工場", "lancers/HACCP"],
    regions: ["JP"],
  },
  {
    title: "食品工場の原料在庫・トレーサビリティがFileMaker/Accessで止まっている",
    summary: "食品工場の原料在庫管理システム・米のトレーサビリティ帳票・石けん製造の製品トレーサビリティ管理がFileMaker/Access/Firebird等のレガシーDBで運用されている。Webエンジニアでは触れない領域で、業務知識×レガシー技術の両方が必要。最終的にトレーサビリティ受発注連動を視野に入れた段階的移行のニーズ。",
    vertical: "food",
    sources: ["lancers/食品工場", "lancers/トレーサビリティ"],
    regions: ["JP"],
  },
  {
    title: "食品物流のトレーサビリティが業界横断課題、ブロックチェーン参入が始まっている",
    summary: "物流トレーサビリティ専門ライター募集・ブロックチェーン活用企業の食品トレーサビリティ調査・TaaS（Traceability as a Service）プロモーション動画など、新興サービスの参入が活発。一方で現場理解を持つ人材が圧倒的に不足し、業界外スタートアップと現場のギャップが顕著。",
    vertical: "food",
    sources: ["lancers/トレーサビリティ"],
    regions: ["JP"],
  },
  {
    title: "食品工場のIoT温湿度計など現場センサーの業種別販促が業界全体の課題",
    summary: "IoT温湿度計のチラシを「農業・低温倉庫・食品加工業」業種別に複数バージョンで制作する依頼。センサーメーカーが業種別アプローチに苦戦しており、業種ごとの現場課題を踏まえた訴求コンテンツへの慢性需要がある。",
    vertical: "food",
    sources: ["lancers/食品工場", "lancers/HACCP"],
    regions: ["JP"],
  },
  {
    title: "食品安全規格（HACCP/ISO22000）を発注企業に説明する資料作成リソース不足",
    summary: "食品安全規格プレゼン用パワポ資料作成（10,000〜20,000円）・食品衛生クラウドサービスパンフレット（80,000〜90,000円）など、専門知識×説明力×デザインを満たす人材が市場で不足。食品安全コンサルや認証支援サービス側が顧客説明用の素材を外注し続けている。",
    vertical: "food",
    sources: ["lancers/HACCP", "lancers/食品工場"],
    regions: ["JP"],
  },
  {
    title: "食品メーカーの小ロット販促物デザインの慢性的需要",
    summary: "有機甘酒ラベル・きくらげ佃煮リーフレット・果物ペーストチラシ・キムチ卸チラシ・栄養パウダー撮影など、30,000〜50,000円規模の小ロット販促物が常時発注。デザイナー個人を毎回探す手間が業界全体に積もっている。父の会社（食品コーディネート業）の顧客層と完全一致。",
    vertical: "food",
    sources: ["lancers/食品"],
    regions: ["JP"],
  },
  {
    title: "飲食店PR記事の代行ニーズが大量発注されている",
    summary: "「15,000円で500文字×30記事」が同一クライアントから繰り返し発注（同じ案件が複数回出現）。飲食店経営者が自分でPR記事を書く時間・スキルがない構造的ニーズ。WordPress組み込みまでセット。AIで一次稿作成して人が手直しする運用と相性が良い。",
    vertical: "food",
    sources: ["lancers/飲食店", "lancers/食品"],
    regions: ["JP"],
  },
  {
    title: "中小製造業の生産管理がExcel/Access/VB.net/FileMakerで完全レガシー化",
    summary: "Access受発注をLaravelで再構築・老朽化VB.netシステムをWeb移行・FileMaker生産管理の不具合修正とiPad対応・ハンディターミナルQR読取からExcel出力など、古い技術スタックが現場を支えている現実。中小製造業のレガシー脱却ニーズが極めて根深く、最新技術だけでは入れない領域。",
    vertical: "manufacturing",
    sources: ["lancers/生産管理", "lancers/受発注", "lancers/製造業"],
    regions: ["JP"],
  },
  {
    title: "中小製造業のMRP（資材所要量計算）内製化需要が顕在化",
    summary: "「注文情報と部品表からMRPロジックを組み込んだシステム開発」が400,000〜500,000円で発注。既存ERPは高すぎるため内製化したいが、業務知識（BOM・部品表・所要量計算）が必須で参入障壁が高い。製造業ドメイン知識を持つ開発者の希少性が金額に表れている。",
    vertical: "manufacturing",
    sources: ["lancers/生産管理"],
    regions: ["JP"],
  },
  {
    title: "製造業の重複入力・転記がシステム分断のせいで蔓延",
    summary: "「複数システムへの重複入力単一化」「CSV→Excel→請求書自動化」「Web EDI注文書を生産管理対応CSV変換」など、人が転記している現場が大量。基幹システム同士が連携していないために手作業が残っており、AIエージェント・RPAで解ける典型領域。",
    vertical: "manufacturing",
    sources: ["lancers/生産管理", "lancers/受発注"],
    regions: ["JP"],
  },
  {
    title: "製造業の納期遵守率KPIをExcel/VBAで可視化する慢性需要",
    summary: "「生産管理システムデータから製品・工程別の納期遵守率を可視化するExcelマクロ」など、BIツール導入余裕がない中小製造業が既存システムの出力をExcel加工して経営報告する文化が定着。可視化のニーズはあるがダッシュボードSaaSは届いていない層。",
    vertical: "manufacturing",
    sources: ["lancers/生産管理"],
    regions: ["JP"],
  },
  {
    title: "アパレル・食品OEMの海外工場コミュニケーション代行需要",
    summary: "中国アパレル工場との生産管理・価格交渉をWhatsAppで代行（80,000〜90,000円）など、言語×業界知識×現場感が同時に必要な業務代行ニーズ。AI翻訳と人の判断を組み合わせた業務支援サービスの余地がある。",
    vertical: "manufacturing",
    sources: ["lancers/生産管理"],
    regions: ["JP"],
  },
  {
    title: "ファブレスメーカーの業務SaaS設定代行需要（楽楽販売等）",
    summary: "「楽楽販売の発注・生産・入庫管理設定代行」が300,000〜400,000円で発注。中小製造業がSaaSを導入したいが社内でコンフィグできない典型例。SaaSベンダーのオンボーディングが届かない層に対する設定代行・伴走サービスの需要。",
    vertical: "manufacturing",
    sources: ["lancers/受発注", "lancers/生産管理"],
    regions: ["JP"],
  },
  {
    title: "AI/LLMエンジニアの極度の人材不足（Claude/RAG精通者）",
    summary: "「Claude・OpenClaw精通AI自動化スペシャリスト」「月80万でAIエージェント駆動の内製化責任者」「LLM/RAGエンジニア月30〜100万」など、Claude Code Maxを使いこなせるエンジニアの市場価値が急騰。Lancers上で月単価100万円規模の継続案件が目立ち、案件数とエンジニア数の不均衡が深刻。",
    vertical: "ai",
    sources: ["lancers/AIエージェント"],
    regions: ["JP"],
  },
  {
    title: "中小企業のAI導入が「何から始めたらいいか分からない」状態",
    summary: "e-learning制作とAIエージェント開発を組み合わせた伴走支援が複数発注。単発ツール導入ではなく従業員教育とセットで求められている。中小企業向けAI導入支援コンサルが事業として成立する地合いができている。",
    vertical: "ai",
    sources: ["lancers/AIエージェント"],
    regions: ["JP"],
  },
  {
    title: "特定条件絞り込み型の営業リスト作成が業界横断で爆発的需要",
    summary: "食品包装資材・健康食品・食品工場・ネジ製造・金属加工・鉄鋼業（非上場）・ロボット製造・プラスチック樹脂部品・食肉卸売など、業界・業態・地域で細かく絞り込んだ企業リストを5〜11円/件で大量発注。既存DB（BizMaps等）では対応できない条件絞り込みが常時必要で、AI×Web検索の自動化と相性が良い。",
    vertical: "business",
    sources: ["lancers/食品", "lancers/製造業", "lancers/卸売"],
    regions: ["JP"],
  },
  {
    title: "全国1794自治体の連絡先・施策情報を網羅的に集める需要",
    summary: "「全国1794自治体の官民連携担当部署の連絡先収集」「移住支援施策の整理」など、自治体DBは公開情報なのに機械可読な統合DBが存在しない構造的欠落。地方創生・自治体営業に取り組む事業者が毎回手作業でリストを作っている。",
    vertical: "business",
    sources: ["lancers/地方創生"],
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
