/**
 * 高配当株スコアリング設定
 *
 * 3軸スコアの重み・業種基礎スコア・テーマ補正をここで一元管理する。
 * 値を変更して再計算すればスコアが更新される設計。
 */

// ── 総合スコアの重み配分（合計1.0） ──

export const SCORE_WEIGHTS = {
  financial: 0.5, // 財務スコア（過去10年の体質）
  valuation: 0.3, // 割安スコア（今の株価の妥当性）
  industry: 0.2, // 業種スコア（構造的な優位性）
} as const;

// ── 割安度（RIM）のパラメータ ──

export const RIM_PARAMS = {
  coe: 0.08, // 株主資本コスト 8%
  growthRate: 0.02, // 持続成長率 2%
} as const;

// ── 割安スコアの区間定義（ratio → 100点満点） ──
// ratio = 理論PBR / 実PBR

export const VALUATION_SCORE_BANDS: { minRatio: number; score: number }[] = [
  { minRatio: 2.0, score: 100 },
  { minRatio: 1.5, score: 90 },
  { minRatio: 1.2, score: 75 },
  { minRatio: 1.0, score: 60 },
  { minRatio: 0.8, score: 45 },
  { minRatio: 0.5, score: 25 },
  { minRatio: 0.0, score: 10 },
];

// ── 業種基礎スコア（東証33業種） ──

// 1. ディフェンシブ性 (0-8)
export const DEFENSIVE_SCORE: Record<string, number> = {
  // Defensive (+8)
  食料品: 8,
  医薬品: 8,
  陸運業: 8,
  小売業: 8,
  "電気・ガス業": 7, // インフラ安定だが再エネ移行コスト考慮
  // Semi-defensive (+5)
  "情報・通信業": 5, // AI代替リスクで8→5に下方修正
  "情報・通信": 5,
  サービス業: 5,
  建設業: 5,
  "倉庫・運輸関連業": 5,
  不動産業: 5,
  保険業: 5,
  その他金融業: 5,
  "水産・農林業": 5,
  // Cyclical (+3)
  化学: 3,
  機械: 3,
  電気機器: 3,
  精密機器: 3,
  "ガラス・土石製品": 3,
  ゴム製品: 3,
  金属製品: 3,
  その他製品: 3,
  "パルプ・紙": 3,
  卸売業: 3,
  "石油・石炭製品": 3,
  非鉄金属: 3,
  鉱業: 3,
  // Highly cyclical (+0)
  鉄鋼: 0,
  輸送用機器: 0,
  海運業: 0,
  空運業: 0,
  繊維製品: 0,
  "証券・商品先物取引業": 0,
  証券業: 0,
  銀行業: 0,
};

// 2. 関税・地政学リスク (-3 〜 +2)
export const TARIFF_RISK_SCORE: Record<string, number> = {
  // Low exposure (+2)
  "情報・通信業": 2,
  "情報・通信": 2,
  サービス業: 2,
  不動産業: 2,
  保険業: 2,
  その他金融業: 2,
  銀行業: 2,
  "証券・商品先物取引業": 2,
  証券業: 2,
  "電気・ガス業": 2,
  小売業: 2,
  // Moderate (0)
  食料品: 0,
  医薬品: 0,
  建設業: 0,
  陸運業: 0,
  "倉庫・運輸関連業": 0,
  "水産・農林業": 0,
  鉱業: 0,
  // High exposure (-3)
  輸送用機器: -3,
  鉄鋼: -3,
  機械: -3,
  電気機器: -3,
  化学: -3,
  海運業: -3,
  空運業: -3,
  精密機器: -3,
  ゴム製品: -3,
  金属製品: -3,
  "ガラス・土石製品": -3,
  繊維製品: -3,
  "パルプ・紙": -3,
  その他製品: -3,
  卸売業: -3,
  非鉄金属: -3,
  "石油・石炭製品": -3,
};

// 3. 構造的成長性 (0-5)
export const GROWTH_BONUS: Record<string, number> = {
  医薬品: 5, // 高齢化
  "電気・ガス業": 5, // 再エネ・原発回帰・エネルギー安全保障
  "情報・通信業": 3, // インフラ系は追い風だがSIerはAIリスクで5→3
  "情報・通信": 3,
  サービス業: 3, // 人手不足 → 単価上昇
  建設業: 3, // インフラ老朽化更新
  不動産業: 3, // インバウンド・再開発
  精密機器: 3, // 医療機器・IoT
};

// 業種基礎スコアの理論最大値（正規化用）
// ディフェンシブ8 + 関税2 + 成長5 = 15
export const INDUSTRY_BASE_MAX = 15;
// 理論最小値: 0 + (-3) + 0 = -3
export const INDUSTRY_BASE_MIN = -3;

// ── テーマ補正（AI Tier分析で個社単位に付与） ──

// ── 8項目財務スコア配点定義 ──

export const FINANCIAL_SCORING = {
  revenueTrend: { max: 15, label: "売上高トレンド" },
  epsTrend: { max: 15, label: "EPS" },
  operatingMargin: { max: 15, label: "営業利益率" },
  equityRatio: { max: 10, label: "自己資本比率" },
  operatingCf: { max: 15, label: "営業CF" },
  cashTrend: { max: 5, label: "現金等" },
  dividendTrend: { max: 15, label: "1株配当金" },
  payoutRatio: { max: 10, label: "配当性向" },
} as const;

// 金融セクター（自己資本比率の評価基準が異なる）
export const FINANCIAL_SECTOR_INDUSTRIES = [
  "銀行業",
  "保険業",
  "証券業",
  "証券・商品先物取引業",
  "その他金融業",
];

// ── テーマ補正（AI Tier分析で個社単位に付与） ──

export type ThemeAdjustment = {
  theme: string;
  label: string;
  minScore: number;
  maxScore: number;
  description: string;
};

export const THEME_ADJUSTMENTS: ThemeAdjustment[] = [
  {
    theme: "ai_disruption",
    label: "AI代替リスク",
    minScore: -20,
    maxScore: 0,
    description: "受託SIer、BPO、コールセンターなどAIで代替されうる事業",
  },
  {
    theme: "ai_enabler",
    label: "AI活用側",
    minScore: 0,
    maxScore: 10,
    description: "AI基盤、データセンター、半導体装置など",
  },
  {
    theme: "defense",
    label: "防衛・安全保障",
    minScore: 0,
    maxScore: 15,
    description: "重工、防衛エレクトロニクス、サイバーセキュリティ",
  },
  {
    theme: "energy_security",
    label: "エネルギー安全保障",
    minScore: 0,
    maxScore: 10,
    description: "電力、ガス、原発関連、再エネ",
  },
  {
    theme: "infrastructure",
    label: "インフラ老朽化",
    minScore: 0,
    maxScore: 10,
    description: "建設、橋梁、水道、通信インフラ",
  },
  {
    theme: "depopulation_risk",
    label: "人口減少逆風",
    minScore: -10,
    maxScore: 0,
    description: "内需小売（地方）、住宅（新築偏重）",
  },
];
