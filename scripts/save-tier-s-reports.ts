import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { stocks } from "../src/lib/schema/trade";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BATCH_ID = 5;

const reports = [
  {
    code: "3925",
    business: "ビッグデータ処理技術・データクレンジング技術を基盤に企業向けDXソリューションを提供。eKYC（オンライン本人確認）サービス「D-Confia」が成長事業。公的個人認証（JPKI）の主務大臣認定取得済み。ストック型コミッションモデルで継続収益を確保。",
    tailwinds: [
      "犯収法改正（2027年4月）でeKYCがJPKI方式に一本化、D-Confiaへの需要拡大",
      "マイナンバーカードのiPhone搭載でJPKI利用ハードルが低下",
      "DX市場の構造的成長（2030年に国内9.3兆円規模へ）",
      "ストック型ビジネスモデルによる安定収益基盤",
    ],
    headwinds: [
      "主要取引先との契約終了で2026年3月期は売上-18.8%、営業利益-23%超",
      "売上の7割超を2社に依存する顧客集中リスク",
      "AI技術進化によるデータクレンジング・OCRのコモディティ化リスク",
      "eKYC分野でTRUSTDOCK、Liquid等の複数競合",
    ],
    growthComment: "短期的には主要取引先離脱で減収減益局面だが、2027年4月の犯収法改正によるeKYC/JPKI需要拡大が中期的な成長ドライバー。営業利益は上方修正済みで底打ちの兆し。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新規顧客の獲得ペースと顧客分散の進捗",
      "犯収法改正後のeKYC需要の実現度",
      "次回決算発表（2026年5月13日）",
    ],
  },
  {
    code: "8117",
    business: "自動車用品の製造・卸売。新車ディーラー向けボディコーティング剤で市場リーダー、業務用アルコール検知器「ソシアック」でトップシェア。世界60カ国以上に展開。自己資本比率88.6%の堅牢な財務基盤。5期連続過去最高益。",
    tailwinds: [
      "白ナンバー事業者へのアルコール検知器義務化で「ソシアック」の構造的需要拡大",
      "海外コーティング売上がQ3累計+35.4%と急伸（中国・台湾・ベトナム）",
      "新車ディーラーとの長年の関係が高い参入障壁として機能",
      "自己資本比率88.6%、ROE 16%台の堅実かつ高収益体質",
    ],
    headwinds: [
      "主力のコーティング剤は新車販売台数に業績が連動",
      "Keeper技研がディーラー向け営業を開拓し競合侵食の兆し",
      "60カ国超への輸出で円高進行時の収益目減りリスク",
      "中国市場依存度上昇に伴う地政学リスク",
    ],
    growthComment: "ニッチトップ2製品（コーティング・アルコール検知器）で安定高収益。海外売上+35.4%の急伸は成長フェーズ入りを示唆。中期経営計画で2026年3月期に売上425億円・営業利益100億円を目標。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "Keeper技研のディーラー市場侵食の動向",
      "海外売上比率の推移",
      "新車販売台数の動向",
    ],
  },
  {
    code: "6432",
    business: "小型建機（ミニショベル・クローラーローダー）のパイオニア。1971年に世界初のミニショベルを開発。国内生産・9割超を海外輸出。北米・欧州が主力市場。自己資本比率83%。15期連続増配。中計で2028年2月期売上3,000億円目標。",
    tailwinds: [
      "小型建機市場の構造的成長（2032年に154億ドル規模、CAGR 5.65%）",
      "クローラーローダーで競合少なく独自ポジション、北米で特に強い",
      "15期連続増配、配当性向を30%→40%に引き上げ",
      "新工場建設（投資額180億円、2028年1月稼働）で生産能力増強",
    ],
    headwinds: [
      "米国25%関税で2027年2月期に135億円の減益影響（純利益-8%予想）",
      "日本製造・海外輸出モデルゆえの為替リスク",
      "コマツ、キャタピラー等大手の小型建機市場への注力強化",
      "長野県の単一製造拠点に生産集中（災害リスク）",
    ],
    growthComment: "小型建機のグローバルニッチトップ。2026年2月期は過去最高益更新（売上2,252億円、純利益+11.8%）。米国関税が短期的に大きく利益圧迫するも、中計3,000億円チャレンジと新工場建設で中長期成長を志向。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "米国関税の動向（撤回・緩和の可能性）",
      "価格転嫁の進捗と販売数量への影響",
      "新工場稼働後の収益改善度合い",
    ],
  },
  {
    code: "6200",
    business: "社会人教育サービス企業。講師派遣型研修（47%）、公開講座（25%）、ITサービス（15%、LMS「Leaf」）が主力。4,800種類超の研修コンテンツを内製保有。年間延べ受講者数87万人。6期連続増収増益。中計で2027年9月期売上200億円目標。",
    tailwinds: [
      "人的資本経営の制度的後押し（有報での開示義務化で企業の教育投資拡大）",
      "DX教育需要の急拡大（DX関連受講者数+27.6%）",
      "LMS「Leaf」のストック収益拡大（有料組織数+16.1%、741組織）",
      "4,800種類超のコンテンツ内製で規模の経済が競合優位",
    ],
    headwinds: [
      "Q1で積極採用による人件費増が営業利益を圧迫（-4.0%）",
      "DX領域の講師供給不足で受講者数伸び悩み",
      "景気後退時に真っ先に削減されやすい研修予算",
      "リクルートMS、パーソル総研等の大手やUdemy等オンラインプラットフォームとの競合",
    ],
    growthComment: "人的資本経営・リスキリング需要の構造的拡大を追い風に6期連続増収増益。PER約12.8倍・配当利回り4.1%は成長企業として割安感あり。中計CAGR 17%の実行力が焦点。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Q2以降の利益回復（人件費増の吸収）",
      "DX研修の講師確保と供給体制",
      "中計200億円目標の進捗",
    ],
  },
  {
    code: "6196",
    business: "独立系M&A仲介会社。中小企業の事業承継を中心に譲渡・買収双方から手数料を受領する両手仲介モデル。日本初のオンラインM&Aマッチングプラットフォーム「SMART」を運営。2026年4月に持株会社化しFA・戦略コンサルに事業領域拡大。",
    tailwinds: [
      "事業承継ニーズの構造的拡大（2025年M&A件数5,000件超、過去最高）",
      "持株会社化によりFA・戦略コンサルへの事業多角化を推進",
      "1Q大型案件が前年比倍増（13組vs7組）で案件単価上昇",
      "配当大幅増額（91円→180円）と1:3株式分割で株主還元強化",
    ],
    headwinds: [
      "両手仲介モデルへの利益相反規制リスク（2024年に規制強化議論）",
      "上期経常利益の通期進捗率29%と低進捗（通期84億円計画）",
      "新興低価格プレイヤーの参入による手数料水準の下落圧力",
      "案件成約タイミングによる四半期業績の変動が大きい",
    ],
    growthComment: "M&A件数過去最高という構造的追い風の中、持株会社化でFA・戦略コンサルへ事業拡大。1Qは営業利益+135%と好調だが上期累計では経常34%減益。通期84億円達成は下期の大型案件次第。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "通期経常利益84億円の達成可否（下期偏重）",
      "両手仲介規制の議論動向",
      "持株会社体制移行後のシナジー効果",
    ],
  },
  {
    code: "3921",
    business: "国産グループウェア「desknet's NEO」の開発・販売が主力。ノーコードツール「AppSuite」、ビジネスチャット「ChatLuck」も展開。ストック売上が7割超。クラウド解約率は年間わずか0.3%。13期連続増収。日経コンピュータ顧客満足度1位の実績。",
    tailwinds: [
      "クラウドシフト継続でdesknet's NEOクラウド版売上+24.7%",
      "AppSuiteがノーコード市場拡大を追い風に+57.2%の急成長",
      "生成AIプラットフォーム「neoAI Chat for desknet's」で差別化",
      "2024年9月の価格改定効果が解約を伴わず順調に浸透",
    ],
    headwinds: [
      "Microsoft 365/Google Workspaceの包括的サービスとの競争激化",
      "desknet's NEOへの収益依存度が高く次の柱の育成が課題",
      "サイボウズ比で開発人員数・中小企業での認知度が劣る",
      "海外事業（ASEAN）はまだ赤字（黒字化目標2029年1月期）",
    ],
    growthComment: "クラウドシフトと価格改定効果で13期連続増収、営業利益+28%。ROE 25.1%でPER 12倍台は成長企業として割安。生成AI「neoAI Chat」投入でグループウェア×AI領域の先行者優位を狙う。2030年に売上100億円目標。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "2027年1月期の成長率鈍化（+4.7%予想）の動向",
      "海外事業の赤字縮小ペース",
      "neoAI Chatの普及度と追加収益化",
    ],
  },
];

async function main() {
  for (const r of reports) {
    const result = await db
      .update(stocks)
      .set({
        business: r.business,
        tailwinds: r.tailwinds,
        headwinds: r.headwinds,
        growthComment: r.growthComment,
        dividendSustainability: r.dividendSustainability,
        recommendedPosition: r.recommendedPosition,
        watchPoints: r.watchPoints,
      })
      .where(and(eq(stocks.batchId, BATCH_ID), eq(stocks.code, r.code)))
      .returning({ id: stocks.id, code: stocks.code, name: stocks.name });

    if (result.length > 0) {
      console.log(`✓ ${result[0].code} ${result[0].name} updated`);
    } else {
      console.log(`✗ ${r.code} not found in batch ${BATCH_ID}`);
    }
  }
  console.log("\nDone!");
  process.exit(0);
}

main();
