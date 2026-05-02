import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));

type Report = {
  code: string;
  business: string;
  tailwinds: string[];
  headwinds: string[];
  growthComment: string;
  dividendSustainability: "very_high" | "high" | "mid_high" | "mid" | "low";
  recommendedPosition: "core" | "satellite" | "watchlist";
  watchPoints: string[];
};

const reports: Report[] = [
  // ============ TIER S (7件) - batch #6 から引き継ぎ ============
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

  // ============ TIER A 上位 (comp >= 80, 22件) ============
  {
    code: "7374",
    business:
      "ゲーム・エンタメ業界に特化した人材紹介・派遣会社。ゲーム業界経験者DBと業界ネットワークが強み。利回り5.0%・PER 12倍台で配当株として高位置。",
    tailwinds: [
      "ゲーム・eスポーツ・XRなど成長領域のエンジニア需要が継続",
      "ジョブ型雇用浸透で経験者紹介ニーズ拡大",
      "売上+13.8%と上期は増収、業界特化の差別化が機能",
    ],
    headwinds: [
      "2026年3月期通期経常利益を14.8億→12.3億に17.2%下方修正",
      "ゲーム業界の景況感悪化（採用予算削減）が直撃しやすい",
      "リクルート・パーソル等大手とのレッドオーシャン化",
      "ニッチ市場ゆえの規模拡大の天井",
    ],
    growthComment:
      "上期売上+13.8%だが利益下方修正で減益見通し。ゲーム業界の採用厳選化が逆風。配当利回り5%は維持されるが、業績回復シグナルを待ちたい局面。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "ゲーム業界の採用市況回復",
      "下期業績進捗",
      "次年度予想",
    ],
  },
  {
    code: "4318",
    business:
      "関西地盤の人材紹介・人材派遣・看護師紹介を展開。建設業・医療など特定業界への特化と、自社メディア（はたらこねっと等）連携が強み。配当利回り5%超で増配傾向。",
    tailwinds: [
      "上期人材サービス売上+5.3%と堅調",
      "中間配当50円実施、株式分割考慮の年間100円予想で増配基調",
      "自己株取得・譲渡制限付株式付与制度を発表（2026/4/30）と株主還元強化",
      "看護師・介護人材など慢性的不足分野での強み",
    ],
    headwinds: [
      "2027年3月期は採用厳選化で営業・経常減益見通し",
      "景気動向に直結する人材ビジネスの循環性",
      "求人広告デジタル化でIndeed等との競合",
      "関西偏重で全国展開が限定的",
    ],
    growthComment:
      "2026年3月期は増収維持・配当4.2%超で防衛的銘柄。ただし2027年3月期減益見通しで成長性は中立。配当目当ての保有が中心となる。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "2027年3月期の利益進捗",
      "看護師・建設業界の人材需要",
      "自社株買い実施ペース",
    ],
  },
  {
    code: "6036",
    business:
      "カーコーティング・洗車専門店「キーパーLABO」を全国展開。カーコーティング剤の開発・製造・販売も自社で実施。ROE 30%・配当性向33%で高収益かつ増配余力あり。",
    tailwinds: [
      "中古車市場拡大とコーティング需要の構造的成長",
      "Q2投資有価証券売却益で純利+163.5%、財務基盤強化",
      "2026年6月期3Q特別配当40円実施予定（株主還元強化）",
      "店舗網拡大による全国カバレッジ向上",
    ],
    headwinds: [
      "Q2営業利益-8.6%減、本業利益はやや停滞",
      "中央自動車工業（8117）等との競合激化",
      "新車販売鈍化時の影響",
      "店舗オペレーション人件費上昇",
    ],
    growthComment:
      "Q2は特別利益で大幅増益だが本業営利は減少。コーティング市場の成長は継続するが、本業の利益率改善が次の論点。利回り3.4%・PER 8.7倍は割安感あり。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "本業営業利益の回復",
      "店舗増設ペースと既存店成長率",
      "中央自動車工業との競合動向",
    ],
  },
  {
    code: "3371",
    business:
      "ECサイト構築プラットフォーム「ecbeing」（ECパッケージシェア15年連続No.1）が主力。ITソリューション事業（マイクロソフト製品中心のSI）も展開。配当性向高めで安定増配。",
    tailwinds: [
      "EC市場の構造的拡大（特にBtoB EC需要）",
      "2026年3月期は増収増益（売上+8.2%、営利+9.1%）見込み",
      "年間配当55→62円と増配（+7円）",
      "ECソリューション事業Q3累計+8.7%と本業好調",
    ],
    headwinds: [
      "Shopify等海外SaaS型ECとの競合（ecbeingはオンプレ型）",
      "Microsoft部門のライセンス販売は付加価値が薄い",
      "クラウド版への移行投資負担",
      "中小EC案件の単価下落圧力",
    ],
    growthComment:
      "ECソリューションのストック収益が安定成長。配当62円・利回り3.5%・PER 11.8倍で割安感あり。ecbeing顧客基盤の強さが防衛要素。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "ecbeingクラウド版の浸透度",
      "Shopifyとの競合における勝ち筋",
      "通期決算（5月発表予定）",
    ],
  },
  {
    code: "4012",
    business:
      "金融機関向けシステム開発を主力とするSI企業。融資・ローンなど専門領域に強み。2026年12月期は売上+16%予想で成長加速見込み。",
    tailwinds: [
      "2026年12月期売上+16.1%・営利+12.6%予想で高成長維持",
      "金融機関のクラウド・AI移行投資が加速",
      "金融庁の規制対応（マネロン・eKYC等）需要",
      "純利益+8.9%と着実な利益成長",
    ],
    headwinds: [
      "金融機関の投資判断は経済変動の影響を受けやすい",
      "大手SI（NTTデータ・野村総研等）との競合",
      "エンジニア確保コスト上昇",
      "スタンダード市場で機関投資家比率が低い",
    ],
    growthComment:
      "2026年12月期は売上+16%・営利+12%予想と成長性が高い。利回り3.7%・PER 9.4倍で割安感も大きく、金融SI特化の差別化が効いている。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "金融SI需要の継続",
      "エンジニア採用・離職率",
      "プライム市場移行の可能性",
    ],
  },
  {
    code: "9450",
    business:
      "賃貸マンション向けインターネット導入サービスを主力とするインフラ事業者。Wi-Fi一括導入で全国の賃貸物件にカバレッジ。サブスク型収益で安定基盤。",
    tailwinds: [
      "賃貸物件のWi-Fi標準装備化トレンド",
      "2026年6月期予想 売上+7.5%・営利+2.1%で増収増益基調",
      "ストック型収益による安定キャッシュフロー",
      "配当27円維持で利回り4%確保",
    ],
    headwinds: [
      "Q1経常利益-11.1%でスタート鈍化（通期進捗20%）",
      "賃貸市場縮小の影響を直接受ける",
      "純利益-3.7%予想で利益成長は限定的",
      "通信回線コスト上昇圧力",
    ],
    growthComment:
      "Q1進捗20%と慎重スタート。利益成長は限定的だが配当4%・PER 11倍でインカム狙い。賃貸物件Wi-Fi化の構造的需要が下支え。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "Q2以降の利益進捗回復",
      "賃貸物件着工件数",
      "通信コストインフレの影響",
    ],
  },
  {
    code: "3916",
    business:
      "公共・金融・通信向けの受託開発SI。検証ソリューション（QA/テスト）と業務システム開発が主力。配当性向50%以上を目指す方針で増配積極的。",
    tailwinds: [
      "Q1経常+10.5%・上期進捗50.9%と好調",
      "2026年6月期売上+7.6%・営利+1.2%で増収増益",
      "中期目標で配当性向50%以上明示（株主還元強化）",
      "DX需要・公共システム更新需要が継続",
    ],
    headwinds: [
      "公共案件は予算サイクルに業績が依存",
      "エンジニア採用競争激化による人件費上昇",
      "テスト自動化AIツールの普及で検証事業の差別化が課題",
      "営業利益の伸びが+1.2%と鈍い",
    ],
    growthComment:
      "Q1経常+10.5%と好スタート、上期進捗50%超で通期計画達成は射程内。中期目標2030年売上500億円・配当性向50%以上と株主還元・成長の両立を目指す。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Q2業績進捗",
      "検証事業の差別化（AI活用）",
      "中期計画の進捗",
    ],
  },
  {
    code: "3635",
    business:
      "「信長の野望」「三國志」など歴史シミュレーションを源流とするゲーム開発・販売。「無双」シリーズや人気IPの育成、海外売上比率5割超。財務体質極めて健全。",
    tailwinds: [
      "海外売上比率5割超で円安メリット享受",
      "ゲームIP資産による継続的なリメイク・新作展開",
      "配当方針「総配分性向50%または1株50円」明示で下限保証",
      "豊富な現預金・投資有価証券で財務リスク低い",
    ],
    headwinds: [
      "次期配当予想48円（前期66円比減配）で減配シグナル",
      "新作タイトルのヒット依存で業績変動が大きい",
      "Switch 2など新ハード対応の開発投資負担",
      "海外大手との競合・開発費インフレ",
    ],
    growthComment:
      "2026年3月期は66円配当だが次期48円予想で減配局面入り。利回り3%程度に低下する可能性。一方で財務基盤と配当下限保証は強固で、ヒット作次第で再加速余地。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "減配の継続性",
      "次期新作タイトルの売上",
      "海外売上の動向（為替影響含む）",
    ],
  },
  {
    code: "6088",
    business:
      "経営コンサル・IT戦略立案から実行支援まで一貫提供する独立系コンサルティング会社。三菱商事系の人脈ネットワークが強み。フード関連事業（SmartKitchen）も育成中。",
    tailwinds: [
      "2025年3月期上期売上+18.0%・営利+40.7%と高成長",
      "DX・GX・AI関連のコンサル需要が継続拡大",
      "ROE 32%と極めて高収益",
      "三菱商事との関係を活かした大企業案件継続",
    ],
    headwinds: [
      "コンサル業界の人材確保競争激化（アクセンチュア等大手と競合）",
      "プロジェクトベースの収益で四半期業績の変動",
      "フード事業（SmartKitchen）はまだ育成段階",
      "高ROEゆえバリュエーションは下値硬直性に欠ける",
    ],
    growthComment:
      "上期売上+18%・営利+40%と急成長。ROE 32%・利回り4.1%は質量とも優秀。コンサル需要の構造的拡大とFood事業の育成が両輪。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "通期業績の進捗",
      "コンサル人材の確保・離職率",
      "SmartKitchen事業の収益化",
    ],
  },
  {
    code: "3771",
    business:
      "中部地盤のSI企業。トヨタ系企業・地銀向け業務システム開発が主力。クラウド・AI領域への投資加速。期末一括配当方針。",
    tailwinds: [
      "2026年3月期 売上+13%・営利+15%と高成長予想",
      "純利益+15.5%で着実な利益成長",
      "トヨタ系・中部経済圏との安定取引",
      "クラウド・AIシフトでの追加投資需要",
    ],
    headwinds: [
      "中間配当なし（期末一括）でインカム投資家には不便",
      "中部経済圏依存の地域集中リスク",
      "エンジニア確保競争（特に名古屋圏）",
      "大手SIの中部進出による競合",
    ],
    growthComment:
      "2026年3月期売上+13%・営利+15%と二桁成長。配当60円維持・利回り4.3%でPER 10倍台と割安。中部経済の堅調さを反映した安定成長銘柄。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "中部経済圏の景況感",
      "Q3以降の業績進捗",
      "次年度配当方針",
    ],
  },
  {
    code: "4722",
    business:
      "ITコンサル+システム開発の一貫提供型。次世代銀行システム実装など金融・エネルギー・流通分野で大型案件多数。Revamp買収でM&Aコンサル領域を強化。",
    tailwinds: [
      "2025年12月期 売上+8.8%・営利+10.3%と着実成長",
      "次世代銀行システムなど大型案件継続",
      "AI・DXコンサルへのリブランディング進行中",
      "知財活用型プロジェクトで差別化",
    ],
    headwinds: [
      "利回り2.7%とTier A内では低位",
      "コンサル業界の人材確保コスト上昇",
      "大型案件依存で四半期業績変動",
      "Revamp統合のシナジー実現は時間を要する",
    ],
    growthComment:
      "売上+8.8%・営利+10.3%と着実成長。AI/DXコンサルでの存在感拡大、ただし利回り2.7%は配当目線では物足りない。成長株として保有する位置づけ。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "次年度の業績計画",
      "Revampシナジーの数値化",
      "ITコンサル人材の確保",
    ],
  },
  {
    code: "6554",
    business:
      "理工系エンジニア派遣会社。製造業・通信業界へのIT・機械系エンジニア派遣が主力。配当性向43%・利回り4.3%で高位置。",
    tailwinds: [
      "理工系エンジニア需要の構造的拡大",
      "ROE 23.5%と高収益体質",
      "PER 9.2倍と割安",
      "配当年間50円・利回り4.3%で優秀",
    ],
    headwinds: [
      "派遣ビジネスの景況感連動",
      "製造業の設備投資鈍化リスク",
      "テクノプロ・メイテック等大手との競合",
      "グロース市場で機関投資家関与限定的",
    ],
    growthComment:
      "PER 9.2倍・ROE 23%・利回り4.3%で割安・高収益・高配当の三拍子。派遣業界の景況感に注意しつつもバリュー株として保有妥当。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "派遣単価の動向",
      "製造業の設備投資指標",
      "プライム市場移行の可能性",
    ],
  },
  {
    code: "9558",
    business:
      "IT人材派遣・受託開発が主力。技術者数3,000名規模、自社研修体制で未経験者育成を強み化。4期連続増配・配当性向50%堅持。",
    tailwinds: [
      "2026年11月期 売上+8.8%・営利+5.3%予想で増収増益",
      "4期連続増配（年間101円・利回り4.4%）",
      "配当性向50%堅持で株主還元方針が明確",
      "未経験者育成モデルで採用コスト抑制",
    ],
    headwinds: [
      "営業利益+5.3%・経常+3.9%と利益成長は鈍化傾向",
      "派遣単価競争激化（特に下流案件）",
      "大手SES企業との人材獲得競争",
      "教育コスト先行で利益率圧迫",
    ],
    growthComment:
      "売上+8.8%・営利+5.3%で堅調成長。4期連続増配・配当性向50%堅持と株主還元方針が明確。利回り4.4%・PER 11倍で配当株として優秀。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "派遣単価の推移",
      "教育投資の利益率への影響",
      "5期連続増配の継続性",
    ],
  },
  {
    code: "4299",
    business:
      "金融機関向けSI（ATM・勘定系）に強み。三菱UFJ・SMBC等メガバンク、損保・生保が主要顧客。5年連続増配で配当方針が安定。",
    tailwinds: [
      "5年連続増配（年間46円予想・利回り3.9%）",
      "金融機関のシステム更新・クラウド移行需要",
      "配当性向42.9%で増配余地あり",
      "PBR 1.17倍と割安",
    ],
    headwinds: [
      "純利益-3.7%予想と利益は伸び悩み",
      "金融機関の発注集中で顧客集約リスク",
      "ATM縮小トレンドが一部事業に影響",
      "SMBC日興系SI等との競合",
    ],
    growthComment:
      "売上+10.7%だが純利益-3.7%予想で増収減益。5年連続増配の継続が安心感。PBR 1.17倍・利回り3.9%でバリュー株として位置付け。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "純利益減少要因",
      "金融機関の投資計画",
      "次年度配当継続性",
    ],
  },
  {
    code: "3901",
    business:
      "自動車業界の情報プラットフォーム「MarkLines」を運営。世界の自動車メーカー・部品サプライヤーを網羅したDB。価格改定（20年ぶり）と新AIサービスで成長加速。",
    tailwinds: [
      "20年ぶりの価格改定で2026年12月期売上+10%・営利+12%予想",
      "新AIサービス「Pivot AI」で付加価値拡大",
      "EV/SDV化で自動車業界の情報需要が拡大",
      "ROE 23%・営利率37.6%と高収益体質",
    ],
    headwinds: [
      "2025年12月期営利は減益（投資先行）",
      "価格改定後の解約リスク",
      "競合（IHS Markit等）の存在",
      "自動車業界全体の景況感悪化リスク",
    ],
    growthComment:
      "2026年は価格改定+AI新サービスで売上+10%・営利+12%予想と回復基調。利回り3.9%・PER 11.4倍で成長×配当のバランス良好。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "価格改定後の解約率",
      "Pivot AIの利用拡大",
      "自動車業界の景況感",
    ],
  },
  {
    code: "3844",
    business:
      "Microsoft製品（Azure・Dynamics・SharePoint）を中心としたクラウド・DXソリューションSI。3年連続二桁増収。配当性向45%以上方針。",
    tailwinds: [
      "2026年3月期 売上+10.1%・営利+8.0%・純利+5.2%予想",
      "Microsoft Azure・Copilot需要の拡大",
      "配当性向45%以上方針で増配（前期+2円）",
      "Microsoft認定ゴールドパートナーの優位性",
    ],
    headwinds: [
      "Microsoftプロダクト依存で戦略変更リスク",
      "Azureコンサル人材の獲得競争激化",
      "純利益+5.2%と伸びが鈍化",
      "AWS・GCP系SIへの顧客流出リスク",
    ],
    growthComment:
      "Microsoft特化が功を奏しCopilot需要の波に乗る。3年連続二桁増収・配当性向45%以上方針で安定。利回り3.7%・PER 13倍はやや割高感もあるが質高め。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Copilot関連案件の獲得",
      "Microsoft戦略変更の影響",
      "Azureエンジニア採用",
    ],
  },
  {
    code: "7849",
    business:
      "女性向けライト文芸（「野いちご」発の小説原作映像化）と、地域情報誌・PR媒体の発行が二本柱。配当方針は安定型。",
    tailwinds: [
      "原作IPの映像化（実写・アニメ）展開拡大",
      "中期経営計画（2026-2028）公表で成長戦略明確化",
      "PER 10倍・PBR 1.4倍と割安",
      "ROE 13%と中堅出版社では高位置",
    ],
    headwinds: [
      "出版業界全体の縮小トレンド",
      "ヒット作依存で業績変動が大きい",
      "紙媒体（地域情報誌）の構造的減退",
      "詳細な業績情報が限定的（情報開示控えめ）",
    ],
    growthComment:
      "ライト文芸×映像化IPで独自ポジション。中期計画公表で成長戦略が見えるが、出版業界全体の構造逆風は続く。利回り3.3%でインカム妙味あり。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "中期経営計画の進捗",
      "原作IPの映像化案件",
      "出版業界全体の動向",
    ],
  },
  {
    code: "4687",
    business:
      "金融・流通・公共向けSI。アジャイル開発・DX領域のコンサルが成長分野。プライム市場上場。",
    tailwinds: [
      "Q3累計売上+9.0%・営利+6.0%と堅調",
      "全事業分野で増収を達成",
      "アジャイル開発・DXコンサル需要拡大",
      "配当性向37%で増配余地あり",
    ],
    headwinds: [
      "中間配当なし（期末一括）でインカム流動性低い",
      "金融SI市場の競合激化",
      "上流コンサル人材の確保",
      "Q3進捗ペースは想定線止まり",
    ],
    growthComment:
      "Q3累計売上+9%・営利+6%と着実成長。全事業分野で増収は質高い。配当性向37%・利回り3.5%は配当余地あり、プライム市場の安心感もある。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "通期決算の利益進捗",
      "アジャイル/DX案件の単価",
      "次年度配当方針",
    ],
  },
  {
    code: "4481",
    business:
      "SAP/ERPに特化した受託システム開発。中国・無錫拠点でのオフショア活用が強み。年配当117円・利回り5.8%でTier A最高位。",
    tailwinds: [
      "2025年12月期Q1売上+16.1%・営利+22.9%と高成長",
      "SAP S/4HANA移行需要（2027年問題）",
      "DX投資継続でERPコンサル需要拡大",
      "ROE 30%・配当性向49%と質高",
    ],
    headwinds: [
      "中国・無錫拠点の地政学リスク",
      "PBR 4.06倍は割高感",
      "SAP移行特需が一段落した後の成長持続性",
      "アクセンチュア・アビーム等大手との競合",
    ],
    growthComment:
      "Q1売上+16%・営利+22%と急成長、SAP S/4HANA移行需要を取り込む。利回り5.8%・配当性向49%は配当魅力高い、ただしPBR 4倍は要警戒。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "SAP移行案件のパイプライン",
      "中国拠点の地政学リスク",
      "PBR 4倍超のバリュエーション",
    ],
  },
  {
    code: "4674",
    business:
      "中堅独立系SI。デジタルソリューション事業が急成長中（Q3累計+122.4%）。配当性向50%引き上げで株主還元強化。",
    tailwinds: [
      "Q3累計売上+9.5%・営利+11.2%と堅調",
      "デジタルソリューション売上+122%・利益+394%と急成長",
      "配当性向50%引き上げで増配積極化",
      "中期目標 売上700億・営利率11.5%・ROE 15%",
    ],
    headwinds: [
      "本業（基幹SI）の成長は緩やか",
      "デジタル事業の高成長が一過性かの判断必要",
      "エンジニア確保コストの上昇",
      "プライム市場で大手SIとの直接競合",
    ],
    growthComment:
      "Q3デジタル事業+122%と顕著な成長加速。配当58円・利回り4.3%・PER 11倍で割安感も維持。配当性向50%引き上げと中期計画の両輪が魅力。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "デジタル事業の継続的成長",
      "中期計画の進捗（5/8決算発表）",
      "配当性向50%堅持の確実性",
    ],
  },
  {
    code: "7370",
    business:
      "中小企業・医療機関向けPR支援サービス。テレビ・Web媒体露出のプロモーション、メディア接続プラットフォーム運営。",
    tailwinds: [
      "中間配当20円・年間40円予想で利回り5.0%維持",
      "中小企業のPR需要は構造的に存在",
      "PER 20倍は成長期待を反映",
      "ROE 12%と中堅PR企業では妥当水準",
    ],
    headwinds: [
      "Q3累計売上-21.4%・営利-69.6%と大幅減",
      "通期売上-21.2%・営利-52.4%に下方修正",
      "PR業界の競合激化（AI生成コンテンツ含む）",
      "顧客（中小企業・医療機関）の予算削減",
    ],
    growthComment:
      "業績下方修正で通期-52%減益見通し。配当40円維持で利回り5%は確保するが、業績悪化シグナルは強い。配当維持の持続性に注意。",
    dividendSustainability: "mid",
    recommendedPosition: "watchlist",
    watchPoints: [
      "売上減少要因の特定",
      "次年度業績回復",
      "配当維持の持続性",
    ],
  },
  {
    code: "3937",
    business:
      "病院向け医療情報システムが主力。テクノロジーコンサルティングと医療データ分析を併用。メディカル事業セグメント利益率66%と極めて高収益。",
    tailwinds: [
      "メディカル事業好調で増収増益（利益率66.4%）",
      "病院DX・電子カルテ更新需要",
      "期末配当13円（前期+2円）の増配方針",
      "医療データ分析という独自ポジション",
    ],
    headwinds: [
      "テクノロジーコンサル事業は戦略的売上抑制で減収減益",
      "2026年3月期通期配当予想未定（不透明感）",
      "病院IT予算の景気依存",
      "電子カルテ大手（富士通・NEC等）との競合",
    ],
    growthComment:
      "メディカル事業の利益率66%は極めて優秀。配当方針が未定なのは不透明だが、医療DX需要の構造的拡大は強い追い風。次回決算（5/14）で成長性再確認。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "通期配当予想の発表（5/14決算）",
      "メディカル事業の継続成長",
      "テクノロジーコンサル事業の回復",
    ],
  },

  // ============ TIER A 下位 (comp < 80, 26件) ============
  {
    code: "2154",
    business:
      "理工系エンジニア派遣・建設技術者派遣の大手。利回り4.9%・配当性向高めで配当株として位置。",
    tailwinds: [
      "理工系・建設エンジニアの慢性不足",
      "ROE 16.5%・PER 12.6倍と質高",
      "利回り4.9%で配当魅力大",
    ],
    headwinds: [
      "派遣業界の景況感連動",
      "建設業界の人手不足が同時にコスト圧力",
      "テクノプロ等大手との競合",
    ],
    growthComment:
      "理工系・建設派遣の市場は構造的需要があるが景気影響大。利回り4.9%は防衛的だが成長性は中立。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "派遣単価の推移",
      "建設業需要",
      "次年度業績計画",
    ],
  },
  {
    code: "7039",
    business:
      "BtoB営業支援（インサイドセールス代行）大手。SaaS企業・大手企業の営業DXを支援。",
    tailwinds: [
      "インサイドセールス市場の構造的拡大",
      "利回り5.3%は同業内最高位",
      "SaaS市場成長の恩恵",
    ],
    headwinds: [
      "PER 9.9倍は割安だが成長期待限定的",
      "ROE 11.8%は同業比やや低位",
      "AI営業ツール台頭による侵食リスク",
    ],
    growthComment:
      "インサイドセールス市場拡大の追い風はあるがROE 11%・成長期待限定。利回り5.3%でインカム狙い。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "営業DX市場の成長",
      "AI営業ツール競合",
      "ROE推移",
    ],
  },
  {
    code: "4345",
    business:
      "建設・土木業界向けITソリューション。i-Construction（国交省）対応で公共需要を取り込む。",
    tailwinds: [
      "i-Construction政策の継続",
      "建設業のDX需要拡大",
      "ROE 18.8%と高収益",
    ],
    headwinds: [
      "公共予算サイクル依存",
      "建設業の景況感影響",
      "コマツ等大手の建機×ITとの競合",
    ],
    growthComment:
      "建設DX市場の構造的成長を取り込む。ROE 18.8%・PER 12.8倍はバランス良好。利回り3.6%は中位。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "i-Construction政策動向",
      "公共建設投資",
      "コマツとの競合",
    ],
  },
  {
    code: "3003",
    business:
      "三菱UFJ系の不動産会社。都心オフィス・ホテル・観光施設の取得・運用が主力。安定的な賃料収入と再開発益。",
    tailwinds: [
      "都心オフィス賃料の上昇トレンド",
      "観光・ホテル需要の回復",
      "ROE 13%・PER 11倍で不動産株として割安",
    ],
    headwinds: [
      "金利上昇による不動産バリュエーション圧縮",
      "オフィス需要の構造変化（リモートワーク）",
      "ホテル需要は景気・観光客動向に依存",
    ],
    growthComment:
      "都心不動産REIT的なポジション。利回り3.8%・PER 11倍で安定インカム。金利動向に注意。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "国内金利動向",
      "都心オフィス賃料",
      "観光客数",
    ],
  },
  {
    code: "2301",
    business:
      "新卒・若手向け人材紹介プラットフォーム「Re就活」が主力。20代特化採用支援で差別化。",
    tailwinds: [
      "20代転職市場の拡大",
      "人材難で企業の若手採用ニーズ強い",
      "PER 8.6倍と割安",
    ],
    headwinds: [
      "景気後退時の採用予算削減直撃",
      "リクルート・マイナビ大手との競合",
      "ROE 13%は中位",
    ],
    growthComment:
      "20代特化で差別化、利回り4.7%・PER 8.6倍と割安。採用市況に直結する循環性に注意。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新卒・若手採用市況",
      "Re就活会員数",
      "競合との差別化",
    ],
  },
  {
    code: "4746",
    business:
      "中部地盤の独立系SI。中堅金融機関・製造業向けシステム開発。",
    tailwinds: [
      "中部経済圏の堅調",
      "PBR 1.53倍と割安",
      "利回り4.0%は配当魅力あり",
    ],
    headwinds: [
      "ROE 11.9%とやや低位",
      "PER 14倍はSIとしてはやや割高",
      "大手SIの中部進出による競合",
    ],
    growthComment:
      "中部地盤の中堅SIとして安定。利回り4%確保するも成長性は中立。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "中部経済の景況感",
      "ROE推移",
      "金融SIパイプライン",
    ],
  },
  {
    code: "7792",
    business:
      "磁気健康アクセサリー（ネックレス・ブレスレット）の製造販売。プロスポーツ選手装着の広告効果で認知拡大。",
    tailwinds: [
      "ROE 28.6%と非常に高収益",
      "健康志向の構造的拡大",
      "PER 9.5倍と割安",
    ],
    headwinds: [
      "競合（ファイテン等）との差別化",
      "新製品ヒット依存",
      "海外展開は限定的",
    ],
    growthComment:
      "ROE 28%・PER 9.5倍で割安・高収益。利回り3.2%は中位。健康アクセ市場の伸び次第。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新製品の売上",
      "海外展開",
      "競合動向",
    ],
  },
  {
    code: "9757",
    business:
      "中小企業向け経営コンサルティング大手。船井流コンサル手法で業種別ノウハウ蓄積。",
    tailwinds: [
      "中小企業のDX・事業承継需要",
      "ROE 26.5%と高収益",
      "利回り4.3%で配当魅力",
    ],
    headwinds: [
      "PBR 4.05倍と割高",
      "コンサル人材の確保競争",
      "中小企業の景況感影響",
    ],
    growthComment:
      "ROE 26.5%・利回り4.3%は質高いがPBR 4倍と割高感あり。中小企業DX需要は構造的追い風。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "中小企業DX需要",
      "コンサル人材確保",
      "PBR 4倍のバリュエーション",
    ],
  },
  {
    code: "9658",
    business:
      "コンサルティング・SI併用型。経営管理（ERP）・連結会計システムに強み。",
    tailwinds: [
      "PBR 1.01倍と極めて割安",
      "利回り4.8%は高水準",
      "ERP更新需要継続",
    ],
    headwinds: [
      "ROE 8.5%と低位",
      "成長性は鈍い",
      "PER 11.7倍は中立",
    ],
    growthComment:
      "PBR 1.01倍・利回り4.8%でディープバリュー。ROE 8.5%と成長性は限定的。配当狙いの保有が中心。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "ROE改善",
      "ERP案件パイプライン",
      "PBR1倍割れの可能性",
    ],
  },
  {
    code: "4828",
    business:
      "製造業向けERPコンサル「mcframe」が主力。SAP代替の国産ERPとして製造業特化。",
    tailwinds: [
      "ROE 27%・営利率高位",
      "SAP S/4HANA移行需要の代替先として注目",
      "製造業DX需要の構造的拡大",
    ],
    headwinds: [
      "PBR 4.81倍と割高",
      "SAPからの本格代替には時間要する",
      "製造業景況感影響",
    ],
    growthComment:
      "国産製造業ERPのニッチトップでROE 27%と高収益。PBR 4.8倍と割高感あるが、製造業DX需要が構造支援。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "mcframe導入実績",
      "SAP代替案件",
      "PBR 4.8倍のバリュエーション",
    ],
  },
  {
    code: "4262",
    business:
      "結婚・引越し・住まい等のライフイベント領域メディア「@nifty」関連サイト運営。",
    tailwinds: [
      "ライフイベント市場の安定需要",
      "PBR 1.5倍と割安",
      "利回り4.1%は中位",
    ],
    headwinds: [
      "ROE 11.2%と中位",
      "メディア競合（楽天・リクルート等）",
      "成長性は限定的",
    ],
    growthComment:
      "ライフイベントメディアとして安定だが成長性は限定。利回り4.1%でインカム狙い。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "メディア競合",
      "新サービス展開",
      "ROE推移",
    ],
  },
  {
    code: "7164",
    business:
      "住宅ローン保証最大手。地銀・信金との連携が強み。",
    tailwinds: [
      "住宅ローン市場安定",
      "代位弁済率は低位安定",
      "利回り3.9%・PER 12.9倍で配当株",
    ],
    headwinds: [
      "金利上昇によるローン市場縮小リスク",
      "地銀統合の影響",
      "成長性は限定的",
    ],
    growthComment:
      "住宅ローン保証のディフェンシブ銘柄。金利動向で需給変化に注意。利回り3.9%で安定インカム。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "国内金利動向",
      "住宅ローン需要",
      "代位弁済率",
    ],
  },
  {
    code: "9746",
    business:
      "税理士事務所向けクラウド会計システム最大手。会計事務所3,400拠点超のロックイン顧客基盤。",
    tailwinds: [
      "電子帳簿保存法・インボイス対応の継続需要",
      "税理士事務所からのストック収益安定",
      "PBR 1.65倍は妥当水準",
    ],
    headwinds: [
      "ROE 11.5%と中位",
      "freee・マネーフォワードとの競合",
      "利回り3.1%は中位",
    ],
    growthComment:
      "税理士事務所ロックインで安定収益。freee・MF等の新興と競合するも顧客基盤は堅固。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "freee・MF競合",
      "税理士事務所数推移",
      "AI会計対応",
    ],
  },
  {
    code: "4743",
    business:
      "コールセンター向けシステム・債権回収管理システムが主力。BPO企業向けに業務システム提供。",
    tailwinds: [
      "BPO市場の拡大",
      "利回り4.6%は高水準",
      "PER 15倍は妥当",
    ],
    headwinds: [
      "ROE 15.4%と中位",
      "クラウドCC（Genesys等）との競合",
      "PBR 2.32倍はやや割高",
    ],
    growthComment:
      "BPO/コールセンター向けニッチ。利回り4.6%は配当魅力大。クラウドCCとの競合に注意。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "BPO業界動向",
      "クラウドCC競合",
      "債権回収システム需要",
    ],
  },
  {
    code: "3649",
    business:
      "病院向け電子カルテ・診療情報統合管理システム。眼科・大学病院に強み。",
    tailwinds: [
      "ROE 22.7%・営利率高位",
      "病院DX需要の構造的拡大",
      "ストック収益基盤",
    ],
    headwinds: [
      "PBR 3.56倍と割高",
      "病院IT予算の景気依存",
      "富士通・NEC等大手との競合",
    ],
    growthComment:
      "ROE 22.7%と高収益。病院DXの追い風はあるがPBR 3.56倍は要警戒。利回り3.4%。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "病院IT投資",
      "ROE維持",
      "大手競合",
    ],
  },
  {
    code: "3150",
    business:
      "電力小売・LED照明販売・蓄電池等の脱炭素ソリューション。中小企業向けエネルギーコスト削減。",
    tailwinds: [
      "ROE 31.3%と非常に高収益",
      "脱炭素・省エネ補助金の継続",
      "電力小売市場の拡大",
    ],
    headwinds: [
      "PBR 3.57倍と割高",
      "電力卸価格変動リスク",
      "新電力業界の競合激化",
    ],
    growthComment:
      "ROE 31%は非常に高い。脱炭素需要が構造的追い風。PBR 3.57倍は警戒だが成長性は高い。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "電力卸価格",
      "脱炭素補助金",
      "ROE維持",
    ],
  },
  {
    code: "3092",
    business:
      "ファッションEC「ZOZOTOWN」運営。Yahoo!連携で取扱高拡大。",
    tailwinds: [
      "ROE 46.6%と圧倒的高収益",
      "Yahoo!Premium会員連携での取扱高拡大",
      "PR・物流のスケールメリット",
    ],
    headwinds: [
      "PBR 8.52倍と極めて割高",
      "PER 18倍も成長期待を反映",
      "競合（楽天ファッション等）との競合",
      "ファッションEC市場の成熟",
    ],
    growthComment:
      "ROE 46%・売上規模は圧倒的だがPBR 8.5倍は警戒。利回り3.9%でインカムも一定確保。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "PBR 8倍超のバリュエーション",
      "ファッションEC市場成熟度",
      "Yahoo!連携の継続性",
    ],
  },
  {
    code: "7921",
    business:
      "金融商品ディスクロージャー印刷・電子開示プラットフォーム。法定開示書類の電子化で構造変化対応。",
    tailwinds: [
      "上場企業の開示業務拡大",
      "ESG・サステナビリティ開示需要",
      "PBR 1.43倍と割安",
    ],
    headwinds: [
      "ROE 14%は中位",
      "印刷ビジネスの構造的縮小",
      "PER 14倍はやや割高",
    ],
    growthComment:
      "開示書類電子化を主軸に転換中。ESG開示需要が追い風。利回り3.6%で安定インカム。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "電子開示シェア",
      "ESG開示案件",
      "印刷事業の縮小ペース",
    ],
  },
  {
    code: "4198",
    business:
      "ゲームアプリ開発・教育系eラーニングコンテンツ制作。",
    tailwinds: [
      "PBR 1.42倍と割安",
      "利回り4.0%は配当魅力",
      "eラーニング需要の継続",
    ],
    headwinds: [
      "PER 122倍は極めて高い（特殊要因の可能性）",
      "ROE 9.7%と低位",
      "ヒット作依存で業績変動",
    ],
    growthComment:
      "PER 122倍は特殊要因（一過性損失等）の可能性で要精査。利回り4%は維持されているが業績の安定性に課題。",
    dividendSustainability: "mid",
    recommendedPosition: "watchlist",
    watchPoints: [
      "PER高騰の要因",
      "次期業績計画",
      "配当継続性",
    ],
  },
  {
    code: "3964",
    business:
      "中古車・花卉・ブランド品等のBtoBオンラインオークション運営。手数料モデルで安定収益。",
    tailwinds: [
      "ROE 22.7%と高収益",
      "中古車輸出市場の構造的成長",
      "BtoBオークション市場の拡大",
    ],
    headwinds: [
      "PBR 4.11倍と割高",
      "中古車市場の景況感影響",
      "競合（USS等）との競合",
    ],
    growthComment:
      "BtoBオークションのプラットフォーマーでROE 22.7%。PBR 4倍超は警戒。利回り3.4%は中位。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "中古車輸出市場",
      "PBR 4倍超のバリュエーション",
      "USSとの競合",
    ],
  },
  {
    code: "7804",
    business:
      "屋外大型広告印刷・特殊印刷が主力。サイン・ディスプレイ業界向け。",
    tailwinds: [
      "PER 10.3倍・PBR 1.4倍と割安",
      "利回り3.9%は配当魅力",
      "屋外広告需要の安定",
    ],
    headwinds: [
      "ROE 12.9%は中位",
      "印刷業界の構造的縮小",
      "デジタルサイネージへの代替",
    ],
    growthComment:
      "印刷業界では割安水準。利回り3.9%でインカム狙い。デジタルサイネージへの転換が中期課題。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "屋外広告需要",
      "デジタルサイネージ対応",
      "ROE推移",
    ],
  },
  {
    code: "1414",
    business:
      "高速道路・橋梁の補修工事専門。インフラ老朽化対応で構造的需要。",
    tailwinds: [
      "高速道路・橋梁の老朽化更新需要",
      "ROE 14.5%は妥当",
      "利回り3.5%で安定",
    ],
    headwinds: [
      "PBR 2.53倍はやや割高",
      "PER 17.6倍は割高感",
      "公共予算依存",
    ],
    growthComment:
      "インフラ老朽化対応の構造需要は強いがPER 17倍は割高。利回り3.5%は配当株として中位。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "国土強靭化予算",
      "PER水準",
      "公共工事発注",
    ],
  },
  {
    code: "7979",
    business:
      "歯科材料（コンポジットレジン・歯冠材料）の老舗メーカー。京都本社、世界100カ国超に展開。",
    tailwinds: [
      "PBR 1.29倍・PER 12.5倍で割安",
      "歯科材料の安定需要",
      "海外売上比率高い",
    ],
    headwinds: [
      "ROE 10.3%と低位",
      "成長性は限定的",
      "為替変動リスク",
    ],
    growthComment:
      "歯科材料のニッチプレイヤーで割安。ROE 10%は低位だが利回り3.2%・PBR 1.3倍はディープバリュー。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "海外売上推移",
      "ROE改善",
      "為替動向",
    ],
  },
  {
    code: "6184",
    business:
      "葬儀・墓・仏壇等の終活情報メディア「いい葬儀」運営。地方自治体との連携拡大。",
    tailwinds: [
      "高齢化で終活需要の構造的拡大",
      "ROE 15.7%は妥当",
      "利回り4.3%は高水準",
    ],
    headwinds: [
      "PBR 3.18倍と割高",
      "PER 17.6倍は割高感",
      "メディア競合",
    ],
    growthComment:
      "終活市場は構造的成長だがPBR 3倍超は警戒。利回り4.3%でインカム魅力あり。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "高齢化動向",
      "メディア競合",
      "PBR 3倍超のバリュエーション",
    ],
  },
  {
    code: "6223",
    business:
      "産業用空調・除湿装置メーカー。半導体クリーンルーム・データセンター向けに強み。",
    tailwinds: [
      "半導体・データセンター投資の構造拡大",
      "PER 10.8倍・PBR 1.3倍で割安",
      "利回り3.3%で配当魅力",
    ],
    headwinds: [
      "ROE 11.1%は中位",
      "半導体投資サイクル変動",
      "為替変動リスク",
    ],
    growthComment:
      "DC・半導体向け空調のニッチプレイヤーで割安。利回り3.3%は中位だが成長性ある。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "半導体投資サイクル",
      "DC投資",
      "為替動向",
    ],
  },
  {
    code: "7839",
    business:
      "プレミアムバイクヘルメットの世界ブランド「SHOEI」。MotoGPライダー多数装着。",
    tailwinds: [
      "ROE 20.5%と高収益",
      "プレミアムブランド優位性",
      "海外売上比率高い",
    ],
    headwinds: [
      "PBR 3.1倍とやや割高",
      "バイク市場の構造的縮小",
      "為替変動リスク",
    ],
    growthComment:
      "プレミアムヘルメットの世界ブランドでROE 20%。バイク市場縮小がリスクだがブランド力で対抗。利回り3.3%。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "海外バイク市場",
      "PBR 3倍超のバリュエーション",
      "為替動向",
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

  console.log(`latest batch: ${batch.id} (${batch.generatedAt})`);
  console.log(`reports to write: ${reports.length}`);

  let ok = 0;
  let ng = 0;
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
    if (result.length > 0) {
      console.log(`✓ ${result[0].code} ${result[0].name}`);
      ok += 1;
    } else {
      console.log(`✗ ${r.code} not found`);
      ng += 1;
    }
  }

  console.log(`\nDone. ok=${ok}, ng=${ng}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
