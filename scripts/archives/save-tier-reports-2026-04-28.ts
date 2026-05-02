import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));

const reports = [
  {
    code: "7191",
    business:
      "総合保証サービス会社。家賃債務保証を起点に、医療費・介護費・養育費保証へ横展開。リスクを負わないソリューション事業（審査受託・決済・SMS送信）が成長の柱に。9期連続増配、営業利益率20%超。プライム市場再上場を目指す。",
    tailwinds: [
      "民法改正で連帯保証人制度が厳格化→保証会社利用が不可逆的に拡大",
      "高齢化で医療費・介護費保証の需要が構造的に増加（介護は前年比1.5倍成長）",
      "養育費保証の自治体導入が全国展開中（社会課題解決型で政策的後押し）",
      "M&Aで事業用物件保証を強化（ラクーンレント子会社化）",
      "配当性向60%目標への引上げ方針",
    ],
    headwinds: [
      "全保連・日本セーフティーなど大手同業との競合激化",
      "景気悪化時の代位弁済増加リスク",
      "M&A統合リスク（ラクーンレントは買収時点で営業赤字）",
      "プライム上場未達の場合、機関投資家の投資対象外のまま",
    ],
    growthComment:
      "2026年3月期通期予想は売上120億円(+13.5%)・営業利益26億円(+11.6%)。Q1は売上+16%・営利+22%・純利+37%と計画を上回るペース。配当も25円→35円に大幅増配。中期計画の売上150億・営利30億は射程圏内。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "プライム市場移行の進捗（流通株式比率34.9%→35%が要件）",
      "代位弁済率の推移（景気悪化の先行指標）",
      "ラクーンレント統合の進捗と黒字化",
      "配当性向の60%への引上げスケジュール",
    ],
  },
  {
    code: "6432",
    business:
      "小型建機（ミニショベル・クローラーローダー）のパイオニア。1971年に世界初のミニショベルを開発。国内生産・9割超を海外輸出。北米・欧州が主力市場。自己資本比率83%。15期連続増配。中計で2028年2月期売上3,000億円目標。",
    tailwinds: [
      "小型建機市場の構造的成長（2032年に154億ドル規模、CAGR 5.65%）",
      "クローラーローダーで競合少なく独自ポジション、北米で特に強い",
      "15期連続増配、配当性向を30%→40%に引き上げ",
      "新工場建設（投資額180億円、2028年1月稼働）で生産能力増強",
    ],
    headwinds: [
      "米国関税により2026年2月期は31.67億円減益、2027年2月期は112億円減益見込み（鉄鋼派生製品25%関税が2026年4月6日施行済み）",
      "関税コスト増187億円のうち価格転嫁できるのは75億円のみと限定的",
      "日本製造・海外輸出モデルゆえの為替リスク",
      "コマツ、キャタピラー等大手の小型建機市場への注力強化",
      "長野県の単一製造拠点に生産集中（災害リスク）",
    ],
    growthComment:
      "2026年2月期は売上2,252億円(+5.7%)・営利376億円(+1.5%)で過去最高更新。米国関税が短期利益を圧迫するも、価格転嫁進捗と新工場稼働で中長期成長を志向。中計3,000億円チャレンジは継続。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "米国関税の動向（撤回・緩和の可能性、追加関税の有無）",
      "価格転嫁の進捗（187億増コストに対し75億しか転嫁できていない）",
      "2027年2月期の業績進捗と価格戦略",
      "新工場稼働後の収益改善度合い",
    ],
  },
  {
    code: "8117",
    business:
      "自動車用品の製造・卸売。新車ディーラー向けボディコーティング剤で市場リーダー、業務用アルコール検知器「ソシアック」でトップシェア。世界60カ国以上に展開。自己資本比率88.6%の堅牢な財務基盤。5期連続過去最高益。",
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
    growthComment:
      "ニッチトップ2製品（コーティング・アルコール検知器）で安定高収益。Q3累計売上342億(+12.8%)・営利83億(+2.0%)。海外売上+35.4%の急伸は成長フェーズ入りを示唆。通期予想売上455億・営利118億。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "Keeper技研のディーラー市場侵食の動向",
      "海外売上比率の推移",
      "新車販売台数の動向",
      "次回通期決算発表",
    ],
  },
  {
    code: "6200",
    business:
      "社会人教育サービス企業。講師派遣型研修（47%）、公開講座（25%）、ITサービス（15%、LMS「Leaf」）が主力。4,800種類超の研修コンテンツを内製保有。年間延べ受講者数87万人。6期連続増収増益。中計で2027年9月期売上200億円目標。",
    tailwinds: [
      "人的資本経営の制度的後押し（有報での開示義務化で企業の教育投資拡大）",
      "DX教育需要の急拡大（DX関連受講者数+27.6%）",
      "LMS「Leaf」のストック収益拡大（有料組織数+16.1%、741組織、アクティブユーザー407万人超）",
      "公開講座受講者数+14.3%、研修実施回数+9.2%と本業も堅調",
      "4,800種類超のコンテンツ内製で規模の経済が競合優位",
    ],
    headwinds: [
      "Q1で積極採用による人件費増が営業利益を圧迫（売上+7.2%に対し営利-4.0%）",
      "DX領域の講師供給不足で受講者数伸び悩み",
      "景気後退時に真っ先に削減されやすい研修予算",
      "リクルートMS、パーソル総研等の大手やUdemy等オンラインプラットフォームとの競合",
    ],
    growthComment:
      "人的資本経営・リスキリング需要の構造的拡大を追い風に6期連続増収増益。Q1は売上37.6億(+7.2%)・営利14.0億(-4.0%)で人件費先行投資局面。中計CAGR 17%の実行力が焦点。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Q2以降の利益回復（人件費増の吸収）",
      "DX研修の講師確保と供給体制",
      "中計200億円目標の進捗",
    ],
  },
  {
    code: "3925",
    business:
      "ビッグデータ処理技術・データクレンジング技術を基盤に企業向けDXソリューションを提供。eKYC（オンライン本人確認）サービス「D-Confia」が成長事業。公的個人認証（JPKI）の主務大臣認定取得済み。ストック型コミッションモデルで継続収益を確保。",
    tailwinds: [
      "犯収法改正（2027年4月）でeKYCがJPKI方式に一本化、D-Confiaへの需要拡大",
      "マイナンバーカードのiPhone搭載でJPKI利用ハードルが低下",
      "DX市場の構造的成長（2030年に国内9.3兆円規模へ）",
      "ストック型ビジネスモデルによる安定収益基盤",
    ],
    headwinds: [
      "主要取引先との契約終了で2026年3月期は減収減益（通期予想 売上72億・純利14.56億に下方修正）",
      "売上の7割超を2社に依存する顧客集中リスク",
      "AI技術進化によるデータクレンジング・OCRのコモディティ化リスク",
      "eKYC分野でTRUSTDOCK、Liquid等の複数競合",
    ],
    growthComment:
      "短期的には主要取引先離脱で減収減益局面（2026年2月13日通期予想を売上72億・純利14.56億に修正）だが、2027年4月の犯収法改正によるeKYC/JPKI需要拡大が中期的な成長ドライバー。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新規顧客の獲得ペースと顧客分散の進捗",
      "犯収法改正後のeKYC需要の実現度",
      "次回決算発表（2026年5月13日）",
    ],
  },
  {
    code: "6196",
    business:
      "独立系M&A仲介会社。中小企業の事業承継を中心に譲渡・買収双方から手数料を受領する両手仲介モデル。日本初のオンラインM&Aマッチングプラットフォーム「SMART」を運営。2026年4月1日に持株会社化を完了し、FA・戦略コンサルへ事業領域拡大。",
    tailwinds: [
      "事業承継ニーズの構造的拡大（2025年M&A件数5,000件超、過去最高）",
      "持株会社化完了（2026/4/1）でFA・戦略コンサルへの事業多角化を本格推進",
      "Q1売上+32.2%・営業利益+135.2%と大型案件で大幅増益",
      "配当大幅増額（91円→180円）と1:3株式分割で株主還元強化",
    ],
    headwinds: [
      "両手仲介モデルへの利益相反規制リスク（2024年に規制強化議論）",
      "新興低価格プレイヤーの参入による手数料水準の下落圧力",
      "案件成約タイミングによる四半期業績の変動が大きい",
      "持株会社移行直後の組織再編コスト・グループガバナンス負担",
    ],
    growthComment:
      "M&A件数過去最高という構造的追い風の中、2026/4/1に持株会社移行完了し総合コンサルティング企業へ転換。Q1営利+135%と好調なスタート。FA・戦略コンサル事業のシナジー実現が中期成長のカギ。",
    dividendSustainability: "mid_high",
    recommendedPosition: "core",
    watchPoints: [
      "持株会社体制下でのFA・戦略コンサル事業の立ち上がり",
      "両手仲介規制の議論動向",
      "通期業績進捗（下期偏重型）",
    ],
  },
  {
    code: "3921",
    business:
      "国産グループウェア「desknet's NEO」の開発・販売が主力。ノーコードツール「AppSuite」、ビジネスチャット「ChatLuck」も展開。ストック売上が7割超。クラウド解約率は年間わずか0.3%。13期連続増収。日経コンピュータ顧客満足度1位の実績。",
    tailwinds: [
      "クラウドシフト継続でdesknet's NEOクラウド版売上+24.7%",
      "AppSuiteがノーコード市場拡大を追い風に+57.2%の急成長",
      "生成AIプラットフォーム「neoAI Chat for desknet's」で差別化",
      "2024年9月の価格改定効果が解約を伴わず順調に浸透（解約率0.30%維持）",
    ],
    headwinds: [
      "Microsoft 365/Google Workspaceの包括的サービスとの競争激化",
      "desknet's NEOへの収益依存度が高く次の柱の育成が課題",
      "サイボウズ比で開発人員数・中小企業での認知度が劣る",
      "海外事業（ASEAN）はまだ赤字（黒字化目標2029年1月期）",
    ],
    growthComment:
      "クラウドシフトと価格改定効果で2026年1月期は売上82.3億(+13.3%)・営利25.0億(+28.0%)。ROE 25%台でPER 12倍台は成長企業として割安。生成AI「neoAI Chat」投入でグループウェア×AI領域の先行者優位を狙う。2030年売上100億円目標。",
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
  const [batch] = await db
    .select()
    .from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt))
    .limit(1);

  console.log(`Target batch: #${batch.id} (${batch.generatedAt})`);

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
      .where(and(eq(stocks.batchId, batch.id), eq(stocks.code, r.code)))
      .returning({ code: stocks.code, name: stocks.name });

    console.log(
      result.length > 0
        ? `✓ ${result[0].code} ${result[0].name}`
        : `✗ ${r.code} not found in batch ${batch.id}`
    );
  }
  console.log("\nDone!");
  process.exit(0);
}

main();
