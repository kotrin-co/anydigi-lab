import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, desc, eq } from "drizzle-orm";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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
  // ── Tier S 7銘柄 ─────────────────────────────────
  {
    code: "7191",
    business: "家賃債務保証・医療費保証など各種債務保証を主力とする独立系保証会社。家賃保証で業界中核。地方銀行・流通系FCを通じた保証人不要パッケージで全国展開。Q3累計売上+14.4%、営業利益+18.8%と成長加速、配当25→35円に増配。",
    tailwinds: [
      "賃貸入居時の保証人代行需要拡大（少子高齢化・単身世帯増・外国人入居）",
      "医療費保証・介護費用保証など隣接領域への横展開",
      "提携金融機関ネットワーク拡大によるストック収益積み上げ",
      "増配方針の継続（25→35円、配当性向40%目標）",
    ],
    headwinds: [
      "家賃保証は競合（Casa、日本セーフティー、SBI、全保連）多数で価格競争",
      "景気後退時の代位弁済率上昇リスク（与信費用増）",
      "金融子会社化に伴う規制対応コスト",
      "賃貸市場の縮小（人口減）が将来の長期成長を圧迫",
    ],
    growthComment: "保証ストックの積み上げが利益を押し上げ Q3で売上+14.4%/営業利益+18.8%。配当35円への増配で還元姿勢明確。家賃保証中核+周辺領域への横展開で構造的成長余地あり。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "代位弁済率の推移（景気後退局面）",
      "医療費保証・新領域の売上構成比",
      "次回決算（2026年5月）の通期着地",
    ],
  },
  {
    code: "6432",
    business: "小型建機（ミニショベル・クローラーローダー）のパイオニア。1971年に世界初のミニショベル開発。国内生産・9割超を海外輸出、北米・欧州が主力。自己資本比率83%。15期連続増配。中計で2028年2月期売上3,000億円目標。",
    tailwinds: [
      "小型建機市場の構造的成長（2032年154億ドル規模、CAGR 5.65%）",
      "クローラーローダーで競合少なく独自ポジション、北米で特に強い",
      "15期連続増配、配当性向30%→40%へ引き上げ",
      "新工場建設（180億円、2028年1月稼働）で生産能力増強",
    ],
    headwinds: [
      "米国25%関税で2027年2月期に135億円の減益影響（純利益-8%予想）",
      "日本製造・海外輸出モデルゆえの為替リスク",
      "コマツ・キャタピラー等大手の小型建機市場への注力強化",
      "長野県の単一製造拠点への生産集中（災害リスク）",
    ],
    growthComment: "小型建機のグローバルニッチトップ。2026年2月期は売上2,252億円・純利益+11.8%で過去最高益。米国関税で短期は利益圧迫も、中計3,000億円と新工場で中長期成長を志向。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "米国関税の動向（撤回・緩和の可能性）",
      "新工場稼働スケジュール",
      "為替動向（円安享受度）",
    ],
  },
  {
    code: "8117",
    business: "自動車用品の製造・卸売。新車ディーラー向けボディコーティング剤で市場リーダー、業務用アルコール検知器「ソシアック」でトップシェア。世界60カ国以上に展開。自己資本比率88.6%の堅牢な財務基盤。5期連続過去最高益。",
    tailwinds: [
      "白ナンバー事業者へのアルコール検知器義務化で「ソシアック」の構造的需要拡大",
      "海外コーティング売上がQ3累計+35.4%（中国・台湾・ベトナム）",
      "新車ディーラーとの長年の関係が高い参入障壁",
      "自己資本比率88.6%・ROE 16%台の堅実かつ高収益体質",
    ],
    headwinds: [
      "主力コーティング剤は新車販売台数に業績連動",
      "KeePer技研がディーラー向け営業を開拓し競合侵食の兆し",
      "60カ国超への輸出で円高進行時の収益目減りリスク",
      "中国市場依存度上昇に伴う地政学リスク",
    ],
    growthComment: "ニッチトップ2製品（コーティング・アルコール検知器）で安定高収益。海外売上+35.4%の急伸は成長フェーズ入りを示唆。中計で2026年3月期売上425億円・営業利益100億円を目標。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "KeePer技研のディーラー市場侵食動向",
      "海外売上比率の推移",
      "国内新車販売台数",
    ],
  },
  {
    code: "6200",
    business: "社員研修・公開講座を主力とする人材育成企業。eラーニングプラットフォーム「Leaf」が成長事業（ユーザー520万人、+19.9%）。研修・コンサル・リーダー教育の3軸展開。ROE 36.8%の高資本効率。",
    tailwinds: [
      "リスキリング・人的資本経営の制度化で研修需要が構造的拡大",
      "「Leaf」ARR 14.18億円（+16.6%）のSaaSストック収益拡大",
      "公的機関・上場企業への深耕余地",
      "対面研修×eラーニングのハイブリッド需要を独占的に取り込み",
    ],
    headwinds: [
      "Q1営業利益-4.0%（人件費・拠点拡大の先行投資）",
      "競合（リクルート、JMAM、グロービス）の研修DX強化",
      "AI研修コンテンツ自動生成の進化でコモディティ化リスク",
      "急速採用に伴う人件費上昇圧力",
    ],
    growthComment: "Q1売上+7.2%/営業利益-4.0%は人件費先行で一時的減速。Leaf 520万ユーザー、ARR+16.6%とSaaS成長軌道。リスキリング政策追い風で中期高成長継続見込み。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Leaf ARRの伸び率（前年比+15%以上維持できるか）",
      "営業利益率の回復",
      "新規大手顧客の獲得",
    ],
  },
  {
    code: "3925",
    business: "ビッグデータ処理・データクレンジング技術を基盤に企業向けDXソリューションを提供。eKYC（オンライン本人確認）サービス「D-Confia」が成長事業。公的個人認証（JPKI）の主務大臣認定取得済み。ストック型コミッションモデル。",
    tailwinds: [
      "犯収法改正（2027年4月）でeKYCがJPKI方式に一本化、D-Confia需要拡大",
      "マイナンバーカードのiPhone搭載でJPKI利用ハードル低下",
      "DX市場の構造的成長（2030年に国内9.3兆円規模）",
      "ストック型ビジネスモデルによる安定収益基盤",
    ],
    headwinds: [
      "主要取引先との契約終了で2026年3月期は売上-18.8%/営業利益-23%超",
      "売上の7割超を2社に依存する顧客集中リスク",
      "AI技術進化によるデータクレンジング・OCRのコモディティ化",
      "eKYC分野でTRUSTDOCK、Liquid等の競合多数",
    ],
    growthComment: "短期は主要取引先離脱で減収減益局面だが、2027年4月の犯収法改正によるeKYC/JPKI需要拡大が中期成長ドライバー。営業利益は上方修正済みで底打ちの兆し。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新規顧客獲得ペースと顧客分散の進捗",
      "犯収法改正後のeKYC需要の実現度",
      "次回決算（2026年5月13日）の進捗",
    ],
  },
  {
    code: "6196",
    business: "M&A仲介業の老舗。中堅・中小企業の事業承継M&Aを主力とし、独自開発の案件マッチングシステム「SMART」を保有。2026年4月1日付で持株会社体制に移行完了。Q1売上+32.2%/営業利益+135.2%と急回復。",
    tailwinds: [
      "後継者不在の中小企業127万社（2025年）の事業承継需要",
      "M&A仲介業界ガイドライン改定後の業界健全化で老舗の優位性",
      "持株会社移行による海外・隣接領域への拡張余地",
      "Q1で急回復（売上+32.2%/営業利益+135.2%）",
    ],
    headwinds: [
      "日本M&Aセンター・ストライク等の競合との成約案件獲得競争",
      "中小企業庁のM&A支援機関制度・倫理規定強化への対応コスト",
      "案件大型化で仲介手数料率の低下圧力",
      "景気後退時のM&A案件減少リスク",
    ],
    growthComment: "持株会社移行を機に成長フェーズ復帰。Q1で売上+32.2%/営業利益+135.2%と急回復。事業承継需要が構造的に拡大しており、業界トップ3の地位で中期成長性高い。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "成約案件数の前年同期比推移",
      "持株会社化による新規事業（海外・コンサル）の進捗",
      "業界規制変更への対応",
    ],
  },
  {
    code: "3921",
    business: "グループウェア「desknet's NEO」を中心とする業務向けSaaS開発。中小企業・自治体・教育機関に強み。生成AI「neoAI Chat for desknet's」を提供開始。通期売上82.3億円(+13.3%)/営業利益+28.0%。",
    tailwinds: [
      "中小企業・自治体DX市場の構造的拡大",
      "生成AI機能の組み込み（neoAI Chat）で既存顧客のARPU向上",
      "クラウド版移行による収益のストック化進展",
      "デスクネッツDXコンソーシアムによるエコシステム拡大",
    ],
    headwinds: [
      "Microsoft 365・Google Workspaceなど巨大競合との競争",
      "国内グループウェア市場の成熟化",
      "生成AI機能の差別化困難（OpenAI/AnthropicAPI依存）",
      "サイボウズなど直接競合との価格競争",
    ],
    growthComment: "通期売上+13.3%/営業利益+28.0%と二桁成長継続。生成AI統合で既存顧客の継続率・単価向上が見込める。中堅SaaSとして安定収益+成長性両立。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "クラウド版売上比率の推移",
      "neoAI Chat の導入率",
      "MS 365 との競合状況",
    ],
  },

  // ── Tier A 49銘柄 ─────────────────────────────────
  // 情報・通信業（中堅SI・SaaS）
  {
    code: "4481",
    business: "AWS・Salesforceなどクラウド基盤の構築・運用支援を主力とする中堅SIer。AWSプレミアティアサービスパートナー。ROE 30%台の高効率経営。利回り5.88%は全銘柄中でも上位。",
    tailwinds: [
      "クラウド移行需要の構造的拡大（AWSは継続2桁成長）",
      "AWS高位パートナー認定で大手案件獲得",
      "ROE 30%超の高資本効率",
      "中小・準中堅企業のクラウド移行余地大",
    ],
    headwinds: [
      "AWS人材獲得競争激化で人件費上昇",
      "Classmethod、サーバーワークス等の専業競合",
      "クラウド単価のコモディティ化",
      "AWS依存の単一プラットフォームリスク",
    ],
    growthComment: "AWS特化で高ROE/高利回り両立の珍しい構造。クラウド移行需要の中で中堅SIerの中でも収益性が高く、配当成長余力あり。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "AWSパートナー人材数の推移",
      "Salesforce以外の領域開拓",
      "配当性向の維持",
    ],
  },
  {
    code: "3371",
    business: "ECサイト構築パッケージ「ecbeing」が国内ECサイト構築で14年連続シェア1位。BtoB EC・BtoCともに強み。基幹システム・セキュリティも提供。財務健全、自己資本比率高位。",
    tailwinds: [
      "BtoB EC市場の成長（DX・ペーパーレス化）",
      "ecbeing 14年連続シェア1位の参入障壁",
      "クラウド版「ebisumart」の継続課金収益",
      "セキュリティ・基幹系のクロスセル余地",
    ],
    headwinds: [
      "Shopify・楽天・AWS型EC基盤の台頭",
      "クラウドへの主力シフト過渡期の収益不安定化",
      "EC構築単価のコモディティ化圧力",
      "大手SI（NTTデータ・富士通）の中堅市場参入",
    ],
    growthComment: "ECサイト構築パッケージのトップシェアで安定収益。クラウド型へのシフトで継続課金比率が上昇中、中期成長は堅実だが爆発力は限定的。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "ecbeingクラウド版の比率推移",
      "Shopifyとの差別化",
      "ARRの伸び率",
    ],
  },
  {
    code: "3844",
    business: "クラウド・データセンター・先端テクノロジー領域に特化する中堅SIer。Microsoft 365、Salesforce、ServiceNow等の高位パートナー。30%超の高ROEを長年維持。",
    tailwinds: [
      "クラウド・SaaS導入支援需要の継続拡大",
      "Microsoft・Salesforce高位パートナーの地位",
      "ServiceNow等の新興プラットフォーム取り込み",
      "30%台のROEを長年維持する経営効率",
    ],
    headwinds: [
      "クラウド人材獲得競争で人件費上昇",
      "Accenture・SHIFT・SCSK等との大型案件競合",
      "プラットフォーム企業の値上げによるマージン圧迫",
      "案件大型化で受注リードタイム長期化",
    ],
    growthComment: "クラウド・SaaS導入支援の中堅トップクラス。ROE 17%超の高水準を継続、配当性向も安定。生成AI領域への横展開が次の成長軸。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "ServiceNow関連売上の伸び",
      "生成AI関連受注",
      "ROE 17%超の維持",
    ],
  },
  {
    code: "6036",
    business: "カーコーティング「KeePer」サービスを直営店・FC・カーディーラー経由で全国展開。新商品「ダイヤⅡキーパー」が業績下支え。Q2売上+6.9%/営業利益-8.6%。投資有価証券売却益で純利益+163.5%（一時的）。",
    tailwinds: [
      "「ダイヤⅡキーパー」など新商品の好調",
      "カーディーラーとの提携拡大（出張KeePer）",
      "EV・高級車市場でコーティング需要構造的拡大",
      "ROE 30%・自己資本比率高位の堅実な財務",
    ],
    headwinds: [
      "通期経常利益を80→72.8億円に下方修正（増益率12.2%→2.2%）",
      "中央自動車工業（8117）等のディーラー向けコーティング競合",
      "店舗拡大に伴う人件費先行投資",
      "新車販売台数低迷時の出店ペース鈍化",
    ],
    growthComment: "経常利益を下方修正したものの、純利益は特益で大幅増益。新商品で底固めしつつ次の成長フェーズを模索。中期はディーラー連携と海外展開が鍵。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "ダイヤⅡキーパーの売上推移",
      "出張KeePer経由ディーラー数",
      "営業利益率の回復",
    ],
  },
  {
    code: "3901",
    business: "自動車産業向け情報プラットフォーム「MarkLines」を会員制で提供。世界の自動車部品サプライヤーDB・市場分析データで業界標準的地位。海外売上比率高位。ROE 23%。",
    tailwinds: [
      "自動車サプライチェーン分析需要のEV化・地政学で構造的拡大",
      "EV・電池・半導体マッピングへの拡張",
      "海外自動車メーカー会員数の伸長",
      "コンサル・人材紹介などクロスセル収益",
    ],
    headwinds: [
      "自動車業界の景気変動（EV減速・米国関税等）",
      "Bloomberg・S&P Global Mobility等の上位競合",
      "AIエージェント型データサービスとの代替リスク",
      "為替変動（海外売上）",
    ],
    growthComment: "自動車産業のニッチデータプラットフォームで業界標準的地位。EV・関税情勢で情報需要は構造的に拡大、ROE 23%で高効率経営継続。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "海外会員数の伸び",
      "EV・電池関連データの収益化",
      "AIエージェント時代の差別化戦略",
    ],
  },
  {
    code: "4828",
    business: "SAP S/4HANA等のERP導入を主軸とする中堅SIer。製造業中心の顧客基盤。SAPのプラチナパートナー認定。ROE 27%、PBR 4.8倍と評価高い。",
    tailwinds: [
      "SAP ECC 6.0サポート終了（2027年）に伴う移行特需",
      "製造業DX需要の継続拡大",
      "SAPプラチナパートナーの地位",
      "ROE 27%の高効率経営",
    ],
    headwinds: [
      "SAP移行需要は2028年以降減速の懸念",
      "アクセンチュア・電通総研・NTTデータ等大手との競合",
      "SAPコンサル人材獲得難",
      "S/4HANA以外の領域開拓余地が限定的",
    ],
    growthComment: "SAP S/4HANA移行特需を最大の追い風に好業績。2027年期限以降の成長軸（業務領域拡張・海外）が中期テーマ。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "S/4HANA移行案件の受注残",
      "ポストSAP移行の成長戦略",
      "SAPコンサル人材数",
    ],
  },
  {
    code: "3771",
    business: "中堅SIer。製造業・流通業向けシステム開発が主力。名古屋本社、中部圏・東南アジア展開。利回り4.28%・PER 10.7倍と割安。",
    tailwinds: [
      "中堅製造業のDX投資継続",
      "中部圏での顧客基盤の厚さ",
      "東南アジア（タイ・ベトナム）拠点でのオフショア",
      "PER 10.7倍と割安水準",
    ],
    headwinds: [
      "中堅SIer群との価格競争",
      "国内エンジニア不足で人件費上昇",
      "クラウド/SaaS化でカスタム開発需要が縮小",
      "海外拠点の為替・地政学リスク",
    ],
    growthComment: "中部地盤の堅実SIer。PER 10.7倍/利回り4.28%でバリュー要素が強い。爆発成長は期待しにくいが、配当継続と業績安定で安定インカム源。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "オフショア拠点稼働率",
      "受注残高の推移",
      "中部地区の製造業景況",
    ],
  },
  {
    code: "7374",
    business: "ゲーム・エンタメ業界に特化した人材紹介・派遣事業。ゲーム業界の専門知識を活かした即戦力マッチングが強み。利回り5.03%、PBR 1.54倍。",
    tailwinds: [
      "ゲーム業界の継続的人材不足",
      "海外ゲームスタジオの日本市場参入",
      "VTuber・eスポーツ等の隣接領域拡大",
      "高利回り5.03%",
    ],
    headwinds: [
      "ゲーム業界の景気変動（リストラ局面リスク）",
      "リクルート・パーソル等の総合人材大手の参入",
      "AI生成によるエンタメ制作工程の自動化",
      "派遣法規制リスク",
    ],
    growthComment: "ゲーム特化の人材ニッチで安定。海外スタジオ進出やVTuber等の隣接拡大で中期成長余地。利回り5%超は配当目的でも魅力。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "ゲーム業界の景況",
      "新規事業領域への拡張",
      "AI による業務代替動向",
    ],
  },
  {
    code: "4012",
    business: "AWS構築・運用支援を主力とする中堅SIer。「AXIS Pro」など独自ツールも展開。利回り3.73%、PER 9.36倍と割安。",
    tailwinds: [
      "クラウドリフト＆シフト需要の継続",
      "AWS高位パートナーとして案件獲得力",
      "PER 9.36倍と割安",
      "ROE 16%台の安定収益",
    ],
    headwinds: [
      "クラウド人材獲得競争による人件費上昇",
      "ベース（4481）・サーバーワークス等の競合",
      "AWS単価のコモディティ化",
      "顧客集中リスク",
    ],
    growthComment: "AWS中堅SIerの一角。割安バリュー特性が強く、安定インカム狙いで保有可能。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "AWS関連売上の比率",
      "AXIS Proなど独自ソリューションの伸び",
      "PER水準の維持",
    ],
  },
  {
    code: "4722",
    business: "コンサルティング+IT実装で大企業の経営課題を解決するITコンサル中堅。流通・小売・金融・製造業に強み。生成AI領域に積極投資。",
    tailwinds: [
      "DX・生成AI実装の構造的需要",
      "大企業向けコンサル+実装一気通貫の差別化",
      "生成AI領域への先行投資",
      "ストック型保守・運用契約の積み上げ",
    ],
    headwinds: [
      "アクセンチュア・PwC・デロイトなどグローバルファーム競合",
      "コンサル人材獲得競争で人件費上昇",
      "生成AI領域の差別化困難",
      "案件大型化で受注リードタイム長期化",
    ],
    growthComment: "コンサル+実装の独自モデルで安定成長。生成AI実装での先行優位を活かせるか中期の鍵。利回り3.11%は控えめだが配当成長余地あり。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "生成AI関連案件の受注額",
      "コンサルタント人数の推移",
      "ROE 19%台の維持",
    ],
  },
  {
    code: "4746",
    business: "情報処理サービスを主力とする中堅SIer。神奈川県相模原を地盤に運送・物流向け業務システムが強み。自己資本比率高位、堅実経営。",
    tailwinds: [
      "物流業界2024年問題対応のシステム需要",
      "中堅運送業のDX投資継続",
      "高自己資本比率の堅牢な財務",
      "物流向けニッチで安定顧客基盤",
    ],
    headwinds: [
      "物流業界の人手不足深刻化（顧客の経営圧迫）",
      "顧客集中リスク（特定運送業大手依存）",
      "クラウドSaaS型物流管理の台頭",
      "PER 14.11倍とバリュエーション高め",
    ],
    growthComment: "物流向けSIerのニッチで安定。物流2024年問題の継続対応需要が追い風。爆発成長より配当継続の銘柄。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "主要顧客の業績",
      "物流SaaS競合との差別化",
      "新規業界への横展開",
    ],
  },
  {
    code: "3916",
    business: "金融・公共・流通向けシステム開発が主力の中堅SIer。エンベデッド・組込み開発も提供。ROE 28.98%と高効率。",
    tailwinds: [
      "金融機関のシステム刷新需要継続",
      "公共系の予算拡大",
      "ROE 29%の高資本効率",
      "幅広い業界顧客基盤",
    ],
    headwinds: [
      "金融SI領域でNTTデータ・野村総研等の大手寡占",
      "エンジニア確保競争",
      "国内SI市場の成熟化",
      "PBR 3.11倍とやや割高",
    ],
    growthComment: "金融・公共領域のニッチSIer。高ROE 29%維持で資本効率は業界トップクラス。中期成長は領域拡張の進捗次第。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "金融機関の情報投資動向",
      "エンジニア定着率",
      "ROE 25%以上の維持",
    ],
  },
  {
    code: "3937",
    business: "医療機関向け業務システム・組込みソフト・SaaS型クラウドサービスをグローバル展開。北米・東南アジアにも事業展開。",
    tailwinds: [
      "医療DX需要の構造的拡大（電子カルテ・遠隔医療）",
      "海外（北米・東南アジア）展開の進捗",
      "SaaS型サービスのストック収益化",
      "高ROE 16%超",
    ],
    headwinds: [
      "電子カルテ大手（富士通・NEC・SCSK）の寡占",
      "医療規制への対応コスト",
      "海外展開で為替リスク",
      "国内医療機関のIT投資抑制傾向",
    ],
    growthComment: "医療×組込みSWのニッチプレーヤー。海外展開がうまく行けば中期成長加速。利回り4.26%でインカム妙味。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "海外売上比率の推移",
      "電子カルテ大手との差別化",
      "SaaS収益の比率",
    ],
  },
  {
    code: "4674",
    business: "金融・社会インフラ向けシステム開発を主力とする独立系中堅SIer。組み込みソフト開発も。利回り4.22%。",
    tailwinds: [
      "金融機関の基幹システム刷新需要",
      "社会インフラDX投資の継続",
      "独立系として大手SI下請けからの脱却進展",
      "利回り4.22%",
    ],
    headwinds: [
      "金融SI領域での競争激化",
      "エンジニア確保難",
      "国内SI市場の成熟化",
      "顧客集中リスク",
    ],
    growthComment: "金融SI中堅の堅実プレーヤー。ROE 15%台で安定、配当も継続。バリュー＋インカム狙いの保有候補。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "金融顧客の投資動向",
      "技術者数の推移",
      "新領域への横展開",
    ],
  },
  {
    code: "4299",
    business: "金融・通信・公共向け中堅SIer。横浜地盤。PBR 1.17倍とSI銘柄の中でも特に割安、利回り3.89%。",
    tailwinds: [
      "金融機関のシステム刷新需要",
      "PBR 1.17倍と割安水準",
      "横浜地盤の安定顧客基盤",
      "保守的経営による財務健全性",
    ],
    headwinds: [
      "成長性は限定的（保守的経営の裏返し）",
      "中堅SI同士の価格競争",
      "顧客大手企業のITグループ会社優先傾向",
      "技術者高齢化リスク",
    ],
    growthComment: "PBR 1.17倍と中堅SIerの中でも特に割安。爆発成長は期待しにくいが、安定インカムとPBR是正の両面で底堅い。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "PBR 1倍超の維持",
      "受注残高",
      "東証PBR改善要請への対応",
    ],
  },
  {
    code: "4687",
    business: "金融・流通向けシステム開発を主力とする中堅SIer。東京海上系の独立系。クラウド・アジャイル開発に注力。",
    tailwinds: [
      "金融機関のクラウド移行需要",
      "アジャイル開発の組織的ノウハウ蓄積",
      "東京海上系のブランド信頼性",
      "ROE 17%台の高効率",
    ],
    headwinds: [
      "金融SI領域の大手寡占",
      "アジャイル人材確保競争",
      "顧客集中リスク",
      "PBR 1.96倍",
    ],
    growthComment: "金融SI中堅の中でアジャイル特化で差別化。ROE 17%台維持でバランスの良い銘柄。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "アジャイル案件比率",
      "金融以外の業界拡大",
      "ROE 17%超の維持",
    ],
  },
  {
    code: "4198",
    business: "業務システム開発、ゲームコンテンツ事業、IPライセンス事業を展開。eラーニング教材も提供。PER 123倍と特殊水準（一過性損益要因）。",
    tailwinds: [
      "業務SI受注の安定継続",
      "eラーニング・教材事業の伸び",
      "ゲーム事業の長期ヒット作期待",
      "利回り3.96%",
    ],
    headwinds: [
      "PER 123倍と利益水準が低位（一時的）",
      "ゲーム事業の業績ボラティリティ高",
      "ROE 9.69%とTier A の中では低位",
      "事業多角化による経営資源分散",
    ],
    growthComment: "本業SI＋ゲーム＋IPの混合事業体。PER 123倍は利益水準低位の証拠で、利回り目当てなら底値拾いも、回復確認まで様子見が無難。",
    dividendSustainability: "mid_high",
    recommendedPosition: "watchlist",
    watchPoints: [
      "本業SI事業の利益率",
      "ゲーム事業のヒット動向",
      "EPS回復の確度",
    ],
  },
  {
    code: "9658",
    business: "会計・経営管理ソリューション「ProActive」を主力とする中堅SIer。中堅企業向け基幹システムに強み。利回り4.78%、PBR 1.02倍。",
    tailwinds: [
      "中堅企業の基幹システム刷新需要",
      "ProActiveの長期顧客基盤",
      "PBR 1.02倍と割安",
      "利回り4.78%の高水準",
    ],
    headwinds: [
      "勘定奉行・freee・マネーフォワード等の競合",
      "ROE 8.5%とTier A 内で低位",
      "中堅企業のクラウド移行で従来型ProActiveの陳腐化リスク",
      "成長性に欠く",
    ],
    growthComment: "PBR 1倍ギリギリ・利回り4.78%のバリュー＋インカム銘柄。ProActiveのクラウド版移行が中期の鍵だが、爆発成長は期待しにくい。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "ProActiveクラウド版の比率",
      "PBR 1倍超の維持",
      "ROE 10%超への回復",
    ],
  },
  {
    code: "4262",
    business: "@niftyブランドの比較・口コミサイト運営。住宅ローン・引っ越し・電気料金など生活インフラ系メディアが主力。",
    tailwinds: [
      "アフィリエイト広告市場の安定成長",
      "住宅ローン・電気料金など金額大の比較需要",
      "ストック型コンテンツの長期SEO資産",
      "利回り4.10%",
    ],
    headwinds: [
      "Google検索アルゴリズム変動の影響大（SEO依存）",
      "生成AI検索（SGE/Perplexity）への代替リスク",
      "比較サイト群（価格.com等）との競合",
      "ROE 11%台でTier A 内では中位",
    ],
    growthComment: "生活インフラ比較のニッチメディア。SEO・SGEリスクが構造的不確実性。利回り4.10%は魅力だが、検索構造変化で長期は予断許さず。",
    dividendSustainability: "mid_high",
    recommendedPosition: "watchlist",
    watchPoints: [
      "Google検索アップデートの影響",
      "生成AI検索への対応",
      "新規メディアの立ち上げ",
    ],
  },
  {
    code: "4743",
    business: "金融・流通向けパッケージソフト「FIT」シリーズを提供する中堅ベンダー。利回り4.67%。",
    tailwinds: [
      "FITパッケージの長期安定収益",
      "債権管理パッケージの寡占的シェア",
      "利回り4.67%",
      "ストック比率の高さ",
    ],
    headwinds: [
      "金融パッケージ業界の成熟化",
      "クラウドSaaS型代替の進展",
      "ROE 15%台でTier A 中位",
      "PER 15倍と中堅SI内ではやや割高",
    ],
    growthComment: "金融向けパッケージのニッチプレーヤー。安定インカム源として優秀だが、爆発成長は期待しにくい。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "パッケージのクラウド化進捗",
      "保守料率の維持",
      "金融顧客の継続率",
    ],
  },
  {
    code: "9746",
    business: "中堅会計事務所向け業務システム「TKCシステム」を中核とする独立系SIer。会計事務所ネットワーク（TKC全国会）を持つ独自モデル。",
    tailwinds: [
      "電子帳簿保存法・インボイス制度対応需要",
      "会計事務所のクラウド移行需要",
      "TKC全国会の囲い込み効果",
      "中小企業会計DXの構造的需要",
    ],
    headwinds: [
      "会計事務所数の減少（後継者不在）",
      "freee・マネーフォワード等のクラウド会計の中堅進出",
      "ROE 11.48%と中位",
      "PER 15.09倍",
    ],
    growthComment: "会計事務所向けニッチで強固な顧客基盤。インボイス・電帳法対応で短期需要、長期は会計事務所縮小と若手継承への対応が鍵。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "TKC全国会会員数の推移",
      "クラウド型サービスの比率",
      "freeeとの差別化",
    ],
  },
  {
    code: "3964",
    business: "オートオークション運営。中古車・中古家電・農機具など多品目で展開。海外（韓国・タイ・米国等）にも事業拡大。",
    tailwinds: [
      "中古品市場の構造的拡大",
      "海外展開の進捗（韓国・東南アジア）",
      "農機具など新領域への横展開",
      "ROE 22.67%の高効率",
    ],
    headwinds: [
      "USS等の自動車オークション大手との競合",
      "中古車輸出規制リスク",
      "海外為替リスク",
      "PBR 4.09倍と割高",
    ],
    growthComment: "オートオークションの独立系。海外・新領域への横展開で中期成長。中古品市場の構造的拡大が追い風。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "海外売上比率の推移",
      "新領域（家電・農機具）の収益化",
      "USSとの差別化",
    ],
  },
  {
    code: "3635",
    business: "ゲーム開発・出版（光栄テクモゲームス）を中核とするコンテンツ企業。「信長の野望」「三國志」「DOA」シリーズ等の長寿IPを保有。投資有価証券運用も大きい。",
    tailwinds: [
      "長寿IPの継続的収益",
      "海外（欧米・中華圏）売上比率高",
      "投資有価証券運用益",
      "ROE 18%台",
    ],
    headwinds: [
      "ゲーム業界の景気変動・大型タイトル次第のボラ高",
      "海外大手（任天堂・スクエニ・カプコン）との競合",
      "投資有価証券評価損リスク",
      "PER 16倍と中堅ゲーム内では中位",
    ],
    growthComment: "長寿IPと投資収益の混合体質。ゲーム単体ではなくキャッシュ運用込みの利益構造で、配当継続性は高い。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "新作ゲームの売上",
      "投資有価証券の含み損益",
      "海外売上比率",
    ],
  },
  {
    code: "3649",
    business: "医療機関向け臨床情報統合システム「ファインデックス Claio」を提供。電子カルテと連携した診療情報の統合・閲覧基盤。ROE 22.75%の高効率。",
    tailwinds: [
      "医療DX推進の構造的需要",
      "電子カルテとの連携で医療機関の囲い込み",
      "医療データ活用ビジネスへの拡張余地",
      "ROE 22.75%の高効率",
    ],
    headwinds: [
      "電子カルテ大手（富士通・NEC・SCSK）との競合",
      "医療法規制対応コスト",
      "PBR 3.53倍とやや割高",
      "病院IT予算の制約",
    ],
    growthComment: "医療臨床情報統合のニッチプレーヤー。ROE 22.75%維持で資本効率高く、医療DX需要拡大が中期成長を支える。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "Claio導入医療機関数",
      "医療データ活用ビジネスの収益化",
      "ROE 22%以上の維持",
    ],
  },
  {
    code: "9450",
    business: "賃貸住宅・宿泊施設向け無料Wi-Fi（フリーWi-Fi）サービスを提供。独自開発の無線LANサービス「Free Wi-Fi」を中心にストック型課金。",
    tailwinds: [
      "賃貸住宅DX需要の継続",
      "インバウンド需要回復で宿泊施設のWi-Fi投資",
      "ストック型課金で安定収益",
      "ROE 21.56%の高効率",
    ],
    headwinds: [
      "通信キャリア（ソフトバンク・KDDI）の賃貸住宅市場参入",
      "Wi-Fi 7・5G/6G等の技術競争で設備更新負担",
      "PBR 2.10倍",
      "賃貸住宅市場の長期縮小",
    ],
    growthComment: "賃貸×Wi-Fiのニッチで安定ストック。インバウンド需要も追い風。中期成長は競合大手の侵食次第。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "賃貸案件契約数",
      "宿泊施設導入数",
      "競合大手の動向",
    ],
  },
  {
    code: "7849",
    business: "女性向け・若年層向けの書籍・電子書籍・スマホ小説サイト「野いちご」「魔法のｉらんど」運営。コミック・小説の読者層基盤強い。",
    tailwinds: [
      "電子書籍市場の継続成長",
      "スマホ小説プラットフォームの読者基盤",
      "実写ドラマ化・映画化による作品IP価値拡大",
      "PER 10.24倍と割安",
    ],
    headwinds: [
      "出版市場全体の縮小",
      "ピッコマ・LINEマンガ等大手との競合",
      "コンテンツ制作の継続コスト",
      "ROE 13.41%と中位",
    ],
    growthComment: "女性向け若年層出版のニッチで安定。IP化・映像化が利益に直結する構造。バリュー＋インカム特性。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "電子書籍売上比率",
      "実写化案件の進捗",
      "PER水準の維持",
    ],
  },

  // サービス業（人材・コンサル・専門サービス）
  {
    code: "7039",
    business: "BtoBインサイドセールス代行・営業支援を提供。SaaS企業向けのリードナーチャリング・商談獲得が中核。利回り5.25%。",
    tailwinds: [
      "BtoB SaaS企業の継続的アウトソース需要",
      "インサイドセールス市場の構造的成長",
      "高利回り5.25%",
      "ストック型契約の積み上げ",
    ],
    headwinds: [
      "セレブリックス・SalesNow等の競合",
      "AI営業エージェントによる代替リスク",
      "ROE 11.83%とTier A 内では低位",
      "顧客集中リスク",
    ],
    growthComment: "BtoBインサイドセールスのニッチ。AI営業エージェント時代に独自価値を確立できるかが中期の鍵。利回り5.25%は魅力。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "AI営業ツールへの対応",
      "顧客チャーン率",
      "ROE 12%超への回復",
    ],
  },
  {
    code: "9558",
    business: "技術者派遣・受託開発を主力。機械・電気・電子系のエンジニア派遣で大手メーカー向けに展開。利回り4.68%、ROE 24%。",
    tailwinds: [
      "技術者派遣市場の継続成長（10兆円規模）",
      "メーカーの技術者不足",
      "ROE 24%の高効率",
      "教育研修体系による若手定着率",
    ],
    headwinds: [
      "オープンアップグループ・テクノプロ等の大手との競争",
      "派遣法規制リスク",
      "技術者獲得コスト上昇",
      "PBR 2.55倍",
    ],
    growthComment: "技術者派遣のニッチで高ROE 24%の優良企業。利回り4.68%・配当成長余地もあり、人材派遣分野の中では特に評価できる。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "技術者数の純増",
      "稼働率",
      "ROE 24%の維持",
    ],
  },
  {
    code: "4318",
    business: "人材紹介・求人広告を主力とする総合人材サービス。理美容・医療・建設業界に特化したサイトも展開。利回り4.96%。",
    tailwinds: [
      "労働市場の流動化（転職率上昇）",
      "業界特化型人材紹介の差別化",
      "高利回り4.96%",
      "ROE 22.35%",
    ],
    headwinds: [
      "リクルート・パーソル等の大手との競合",
      "景気後退時の求人激減リスク",
      "派遣・紹介事業の規制対応コスト",
      "PER 15.33倍",
    ],
    growthComment: "業界特化型人材サービスで高ROE 22%。利回り4.96%でインカム妙味。景気感応度が高い点は要注意。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "求人広告売上の動向",
      "業界特化サイトの伸び",
      "景気後退局面の耐性",
    ],
  },
  {
    code: "1414",
    business: "橋梁・道路・トンネルの補修・補強専門の土木建設会社。インフラ更新工事のリーディングカンパニー。中間売上-6.0%/営業利益-4.7%、受注+4.9%。",
    tailwinds: [
      "国土強靱化基本計画 2026〜5年で20兆円超の予算",
      "高度成長期インフラの一斉更新期到来",
      "補修専門で大手ゼネコン未参入のニッチ",
      "受注高+4.9%で先行指標好調",
    ],
    headwinds: [
      "短期業績は中間売上-6.0%/営業利益-4.7%と減速",
      "土木技能者不足",
      "原材料費・労務費の上昇",
      "公共工事依存（政府予算次第）",
    ],
    growthComment: "国土強靱化5年20兆円の追い風が確定。短期は減速も、受注高+4.9%で需要は積み上がる構造。中長期成長性高い。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "受注高の推移",
      "国土強靱化予算の執行",
      "技能者確保の進捗",
    ],
  },
  {
    code: "4345",
    business: "建設・土木向け施工管理アプリ「CTS」シリーズが主力のサービス系SI。建設DX・i-Construction対応で官民の現場に展開。",
    tailwinds: [
      "建設業2024年問題対応のDX需要",
      "i-Construction官民施策追い風",
      "国土強靱化予算の波及効果",
      "ROE 18.80%の高効率",
    ],
    headwinds: [
      "建設DX領域の競合増（コマツ、IIJ、KDDI等）",
      "建設業の労務費高騰で顧客IT投資抑制リスク",
      "PBR 2.19倍",
      "国産建設DXの市場規模制約",
    ],
    growthComment: "建設DXのニッチで成長軌道。国土強靱化・2024年問題のダブル追い風で中期成長性高い。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "i-Construction採用件数",
      "建設業景況",
      "海外展開の動向",
    ],
  },
  {
    code: "7792",
    business: "磁気健康器具「コラントッテ」ブランドの企画・販売。医療機器認証取得済みのアスリート御用達ブランド。",
    tailwinds: [
      "健康志向・予防医療需要の構造的拡大",
      "アスリート起用でブランド浸透",
      "海外（東南アジア・米国）展開余地",
      "ROE 28.63%の高効率",
    ],
    headwinds: [
      "ファイテン等の磁気健康器具競合",
      "ブランド依存（ヒット商品偏重）リスク",
      "EC経由の価格競争激化",
      "PBR 2.39倍",
    ],
    growthComment: "磁気健康器具ニッチでROE 28.63%。健康志向追い風で安定成長、海外展開が中期成長軸。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "海外売上比率",
      "新商品の販売推移",
      "EC比率",
    ],
  },
  {
    code: "2154",
    business: "技術者派遣大手。機械・電気・電子系・IT系エンジニアを大手メーカー・IT企業に派遣。Q2累計純利益+10.2%・通期計画進捗54.9%。",
    tailwinds: [
      "技術者派遣市場の構造的成長（人材派遣10兆円超）",
      "メーカーDX投資の継続",
      "業界トップクラスのスケールメリット",
      "高利回り4.87%",
    ],
    headwinds: [
      "派遣法規制（同一労働同一賃金）対応コスト",
      "技術者獲得競争で人件費上昇",
      "景気後退時の稼働率低下リスク",
      "PBR 1.91倍",
    ],
    growthComment: "技術者派遣のスケール大手で安定。Q2累計純利益+10.2%と着実成長。利回り4.87%でインカム妙味。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "稼働率",
      "技術者数の純増",
      "業界別売上構成",
    ],
  },
  {
    code: "7370",
    business: "経営者・採用・採用ブランディング向けPR・コンサルティングを提供。中堅企業向け広報PR支援が中核。利回り4.96%。",
    tailwinds: [
      "中堅企業の採用ブランディング需要拡大",
      "PR業界のテック化（生成AI活用）",
      "高利回り4.96%",
      "ROE 12%",
    ],
    headwinds: [
      "ベクトル・電通PR等の大手競合",
      "PR効果測定の難しさによる予算切詰めリスク",
      "PER 20.41倍と割高",
      "ROE 12%でTier A 内中位",
    ],
    growthComment: "中堅企業向けPR・採用ブランディングのニッチ。生成AI活用で差別化できれば中期成長。利回り4.96%は配当目的でも妙味。",
    dividendSustainability: "mid_high",
    recommendedPosition: "satellite",
    watchPoints: [
      "クライアント数の推移",
      "AI活用度",
      "PER水準の維持",
    ],
  },
  {
    code: "6088",
    business: "経営コンサル・新規事業創出支援が主力。デジタル戦略・組織変革領域に強み。ROE 32%の高効率。",
    tailwinds: [
      "DX・新規事業創出需要の構造的拡大",
      "ROE 32%の業界トップクラス効率",
      "M&A・事業創出領域への拡張",
      "高利回り4.17%",
    ],
    headwinds: [
      "アクセンチュア・電通総研・PwC等大手との競合",
      "コンサル人材獲得競争",
      "PBR 3.50倍とやや割高",
      "案件大型化で受注リードタイム長期化",
    ],
    growthComment: "戦略コンサルとしてROE 32%は業界群を抜く高水準。DX・新規事業需要追い風で成長性高い。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "コンサルタント人数",
      "受注残高",
      "ROE 30%以上の維持",
    ],
  },
  {
    code: "9757",
    business: "中堅・中小企業向け業種別経営コンサルティングが主力。ロジスティクス事業も展開。2025年12月期売上333.3億(+8.8%)/営業利益88.13億(+5.9%)で6期連続最高益見通し。",
    tailwinds: [
      "中小企業の経営課題（後継者・DX）需要構造的拡大",
      "AX・DXコンサルティングへの拡張",
      "ロジスティクス事業の成長",
      "総還元性向65%以上の株主還元方針",
    ],
    headwinds: [
      "中堅・中小企業の景況悪化時の予算削減",
      "コンサル業界の参入増加",
      "コンサル人材獲得競争",
      "PBR 4.06倍と割高",
    ],
    growthComment: "中堅・中小コンサルの王者。6期連続最高益見通しで安定成長。総還元性向65%以上の株主還元方針も強い魅力。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "AX・DXコンサル売上比率",
      "総還元性向の維持",
      "ロジスティクス事業の成長",
    ],
  },
  {
    code: "6184",
    business: "葬儀・お墓・相続のポータルサイト「いい葬儀」運営。終活市場のリーディングプラットフォーム。利回り4.28%。",
    tailwinds: [
      "高齢化進展で終活市場の構造的拡大",
      "葬儀・相続・お墓のオンライン化需要",
      "ストック型送客手数料の積み上げ",
      "ROE 15.65%",
    ],
    headwinds: [
      "葬儀社業界の縮小（家族葬・直葬の増加で単価減）",
      "競合プラットフォーム（よりそう・小さなお葬式）との競争",
      "PER 17.49倍と割高",
      "アフィリエイトSEO依存",
    ],
    growthComment: "終活市場のニッチプラットフォーム。高齢化追い風、相続領域への横展開で中期成長余地。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "葬儀単価の推移",
      "相続関連売上の伸び",
      "競合との差別化",
    ],
  },
  {
    code: "6554",
    business: "若手エンジニア派遣・育成を主力とする人材サービス。新卒IT人材を集中育成し顧客企業に派遣。高利回り4.99%。",
    tailwinds: [
      "新卒IT人材需要の構造的拡大",
      "高利回り4.99%",
      "ROE 23.48%の高効率",
      "中堅企業のITエンジニア確保ニーズ",
    ],
    headwinds: [
      "新卒採用競争激化",
      "テクノプロ・オープンアップ等の大手との競合",
      "若手定着率リスク",
      "PBR 2.18倍",
    ],
    growthComment: "若手IT人材育成・派遣のニッチ。ROE 23.48%・利回り4.99%でインカム+成長両取り。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "新卒採用人数",
      "稼働率",
      "若手定着率",
    ],
  },
  {
    code: "2301",
    business: "新卒・転職向け求人広告サイト「あさがくナビ」運営。20代に特化した転職サービスが中核。PER 8.64倍と割安、利回り4.70%。",
    tailwinds: [
      "20代転職市場の構造的成長",
      "PER 8.64倍と割安",
      "高利回り4.70%",
      "新卒採用市場の継続",
    ],
    headwinds: [
      "リクルート・マイナビ等の大手との競合",
      "新卒・若年人口減",
      "Indeed等のグローバル求人プラットフォーム",
      "ROE 12.91%と中位",
    ],
    growthComment: "若年層向け人材サービスの中堅。PER 8.64倍はバリュー水準、利回り4.70%でインカム魅力。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "若年求職者数の動向",
      "競合大手の動き",
      "PER水準の維持",
    ],
  },

  // 不動産・卸売・その他
  {
    code: "3150",
    business: "省エネコンサル・電力小売を主力。LED・空調・トランス等の省エネ設備販売、再エネ向け太陽光発電システム販売、新電力事業を展開。Q2売上+3.9%・営業利益+8.1%で過去最高益更新。",
    tailwinds: [
      "電力料金高騰で省エネ・自家消費需要拡大",
      "GX（グリーントランスフォーメーション）政策の追い風",
      "事業用太陽光発電システム販売+22.1%と成長",
      "セグメント利益45億円→51億円計画",
    ],
    headwinds: [
      "新電力事業は電力市場価格変動リスク大",
      "太陽光FIT終了案件の減速可能性",
      "ENECHANGE・グッドフェロー等の競合",
      "PBR 3.56倍",
    ],
    growthComment: "省エネ＋再エネのデュアル成長。Q2過去最高益で勢い良好。GX追い風で中期成長軌道。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "事業用太陽光販売の推移",
      "電力市場価格",
      "GX関連政策動向",
    ],
  },
  {
    code: "7804",
    business: "デジタル印刷・大型インクジェット出力・店頭POP製作を主力。販促物の印刷から取付までワンストップ提供。",
    tailwinds: [
      "店頭マーケティング需要の継続",
      "ワンストップサービスの差別化",
      "PER 10.29倍と割安",
      "利回り3.89%",
    ],
    headwinds: [
      "印刷市場全体の長期縮小",
      "デジタルサイネージへの代替",
      "ROE 12.89%とTier A 内では低位",
      "原材料費上昇",
    ],
    growthComment: "印刷×設置のワンストップでニッチ確立。爆発成長は期待しにくいが、PER 10.29倍は割安水準。",
    dividendSustainability: "mid_high",
    recommendedPosition: "watchlist",
    watchPoints: [
      "デジタル印刷比率",
      "デジタルサイネージとの差別化",
      "印刷市場の縮小ペース",
    ],
  },
  {
    code: "7921",
    business: "上場企業向けディスクロージャー資料制作（決算短信・有報・アニュアルレポート）が主力。タクト印刷も。電子開示・XBRL対応で参入障壁高。",
    tailwinds: [
      "改正法（人的資本開示・サステナビリティ開示）需要拡大",
      "上場企業のIR資料英文化需要",
      "AI活用ディスクロージャー支援への拡張",
      "ROE 14.06%",
    ],
    headwinds: [
      "宝印刷・プロネクサス等の競合",
      "印刷物の電子化（紙減少）",
      "PER 13.96倍",
      "案件単価の引き下げ圧力",
    ],
    growthComment: "ディスクロージャー領域のトップクラスベンダー。サステナ開示・人的資本開示の制度化が追い風。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "サステナ開示関連受注",
      "AI活用サービスの売上化",
      "競合との単価競争",
    ],
  },
  {
    code: "3496",
    business: "機械式駐車場のサブリース主力、月極駐車場紹介サイト「カーパーキング」運営。Q1売上+24.7%/営業利益+25.4%、通期売上170億(+26.1%)/営業利益31.5億(+20.5%)予想。",
    tailwinds: [
      "遊休資産活用需要の構造的拡大",
      "Q1で売上+24.7%/営業利益+25.4%の急成長",
      "通期売上+26.1%予想と高成長軌道",
      "ROE 34.72%の業界最高水準",
    ],
    headwinds: [
      "PBR 7.76倍・PER 23倍と割高水準",
      "都心の機械式駐車場縮小（タワパー減）",
      "競合（タイムズ・三井のリパーク）との競争",
      "金利上昇時の不動産投資減速リスク",
    ],
    growthComment: "遊休資産活用のニッチで高成長。ROE 34.72%・通期売上+26.1%予想と勢い圧倒的。割高だが成長銘柄として保有妙味。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "新規物件契約数",
      "ROE 30%超の維持",
      "PER水準",
    ],
  },
  {
    code: "7979",
    business: "歯科材料・歯科機器の総合メーカー。CAD/CAM関連製品が成長事業。海外売上比率58.7%（北米・中南米・中国堅調）。Q3累計売上291億・営業利益38億（-11.4%）、通期売上408.76億(+5.6%)予想。",
    tailwinds: [
      "高齢化による歯科需要の構造的拡大",
      "海外売上比率58.7%とグローバル展開",
      "CAD/CAM関連の成長",
      "為替円安享受",
    ],
    headwinds: [
      "営業利益-11.4%（材料費・人件費上昇）",
      "通期営業利益-2.9%予想",
      "海外大手（3M、デンツプライ・シロナ）との競合",
      "PER 12.49倍",
    ],
    growthComment: "歯科材料の中堅グローバル企業。海外展開・CAD/CAM成長でトップライン+5.6%、利益面はコスト圧迫で短期足踏み。",
    dividendSustainability: "high",
    recommendedPosition: "satellite",
    watchPoints: [
      "海外売上比率",
      "CAD/CAM関連売上",
      "営業利益率の回復",
    ],
  },
  {
    code: "6223",
    business: "産業用除湿機・吸湿ハニカム機器のグローバルニッチトップ。リチウムイオン電池工場・半導体工場向け除湿に強み。海外売上比率高位。",
    tailwinds: [
      "EV電池工場の世界的増設",
      "半導体製造設備需要の拡大",
      "海外売上比率の高さ",
      "ROE 11.14%",
    ],
    headwinds: [
      "EV普及減速時の電池工場投資抑制",
      "中国地政学リスク",
      "為替変動",
      "PBR 1.30倍は中堅機械内では中位",
    ],
    growthComment: "産業除湿機のグローバルニッチトップ。EV電池・半導体投資の構造的需要を取り込む立ち位置。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "EV電池工場の投資動向",
      "半導体設備投資",
      "海外売上比率",
    ],
  },
  {
    code: "7839",
    business: "二輪車用ヘルメットの世界トップシェア。プレミアムヘルメット「X-Fifteen」「Z-8」シリーズが主力。海外売上比率8割超。",
    tailwinds: [
      "プレミアム二輪需要の構造的拡大（特に欧米）",
      "海外売上比率8割でグローバル成長",
      "ブランド力による高単価維持",
      "ROE 20.46%",
    ],
    headwinds: [
      "為替変動の大きな影響",
      "AGV・ARAI等のプレミアム競合",
      "二輪市場の長期縮小傾向",
      "PER 16.18倍",
    ],
    growthComment: "プレミアムヘルメットのグローバルトップ。海外比率8割で円安享受、ROE 20%台の優良企業。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "為替動向",
      "プレミアムモデル販売",
      "海外二輪市場",
    ],
  },
  {
    code: "3092",
    business: "アパレルEC「ZOZOTOWN」運営。商品取扱高6,660億(+8.4%)、通期売上2,315億・営業利益692億。2027年通期予想売上2,419億(+5.9%)。ROE 46.64%の業界最高水準。",
    tailwinds: [
      "アパレルEC市場の継続成長",
      "ZOZOSUITなど計測技術によるリピート",
      "ROE 46.64%の業界トップクラス効率",
      "Yahoo!連携による集客",
    ],
    headwinds: [
      "PBR 8.49倍・PER 18倍と割高水準",
      "Amazon・楽天・Shein等との競合",
      "アパレル小売市場の景況",
      "出店ブランドのD2C流出",
    ],
    growthComment: "アパレルEC圧倒的トップ。ROE 46.64%・通期売上+5.9%予想と高成長。割高でも資本効率の良さで保有妙味。",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: [
      "商品取扱高の伸び",
      "Yahoo!ショッピングとのシナジー",
      "ブランドD2C化の影響",
    ],
  },
  {
    code: "7164",
    business: "住宅ローン保証専業の独立系保証会社。地方銀行と提携した独立系で全国シェア拡大中。Q3売上+3.9%/経常利益+2.6%、保証残高21兆円目標、ROE目標14%。",
    tailwinds: [
      "地銀提携モデルの全国展開",
      "保証残高19兆円→21兆円目標で着実拡大",
      "1株分割で個人投資家層拡大",
      "実質増配（115円÷2倍換算で前期212円→230円）",
    ],
    headwinds: [
      "金利上昇時の住宅ローン需要減速リスク",
      "都銀系（三井住友信託・三菱UFJ系）との競合",
      "代位弁済率の景気感応度",
      "PBR 1.78倍",
    ],
    growthComment: "住宅ローン保証専業の独立系トップ。中計19兆円を前倒し達成、21兆円・ROE 14%へ。実質増配で還元方針も鮮明。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "保証残高の推移",
      "代位弁済率",
      "金利動向",
    ],
  },
  {
    code: "3003",
    business: "東京駅・銀座・新宿等の都心優良地に不動産を保有・運用する不動産会社（旧富士銀行系）。2026年12月期通期営業利益2,100億(+12.4%)/純利益1,210億(+5.8%)予想、年間配当67円（+5円増配）。",
    tailwinds: [
      "都心優良地の保有資産価値の継続上昇",
      "通期営業利益+12.4%予想",
      "増配継続（前期62円→67円）",
      "Z世代向け新規事業（環境・観光）への拡張",
    ],
    headwinds: [
      "金利上昇時の不動産価値・利回り影響",
      "オフィス需要の長期不透明性",
      "三菱地所・三井不動産等の大手との競合",
      "PBR 1.50倍",
    ],
    growthComment: "都心優良地保有の不動産。通期+12.4%増益・5円増配で配当成長持続。金利上昇リスクは織り込み余地あり。",
    dividendSustainability: "very_high",
    recommendedPosition: "core",
    watchPoints: [
      "金利動向",
      "都心オフィス・商業の稼働率",
      "増配継続",
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

  let success = 0;
  let notFound = 0;
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
      .returning({ code: stocks.code, name: stocks.name, tier: stocks.tier });

    if (result.length > 0) {
      console.log(`✓ ${result[0].tier} ${result[0].code} ${result[0].name}`);
      success++;
    } else {
      console.warn(`✗ ${r.code} not found in batch ${batch.id}`);
      notFound++;
    }
  }
  console.log(`\nDone. updated=${success}, not_found=${notFound}, total=${reports.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
