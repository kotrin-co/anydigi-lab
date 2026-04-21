/**
 * 3軸スコアリングロジック
 *
 * 各軸100点満点に正規化し、重み付きで総合スコアを算出する。
 */

import {
  SCORE_WEIGHTS,
  RIM_PARAMS,
  VALUATION_SCORE_BANDS,
  DEFENSIVE_SCORE,
  TARIFF_RISK_SCORE,
  GROWTH_BONUS,
  INDUSTRY_BASE_MAX,
  INDUSTRY_BASE_MIN,
} from "./scoring-config";

export type ScoreBreakdown = {
  financial: number; // 0-100
  valuation: number | null; // 0-100 (null if ROE/PBR missing)
  industry: number; // 0-100
  composite: number; // 0-100 weighted
};

// ── 財務スコア（100点満点） ──

/**
 * 財務スコアを100点満点に正規化。
 * maxScore=100: 新8項目スコア（そのまま使用）
 * maxScore=85: 旧AnyTradeスコア（100点に正規化）
 */
export function calcFinancialScore(
  rawScore: number | null,
  maxScore: 85 | 100 = 100
): number {
  if (rawScore === null) return 0;
  const clamped = Math.max(0, rawScore);
  if (maxScore === 100) return Math.round(clamped);
  return Math.round((clamped / maxScore) * 100);
}

// ── 割安スコア（100点満点） ──

/**
 * RIM比率を算出し、区間定義に基づいて100点満点に変換。
 * 区間の間は線形補間する。
 */
export function calcValuationScore(
  roe: number | null | undefined,
  pbr: number | null | undefined
): { score: number; ratio: number; label: string } | null {
  if (!roe || !pbr || pbr <= 0) return null;

  const roeDecimal = roe / 100;
  const fairPbr = Math.max(
    0.1,
    1 + (roeDecimal - RIM_PARAMS.coe) / (RIM_PARAMS.coe - RIM_PARAMS.growthRate)
  );
  const ratio = fairPbr / pbr;

  // 区間定義から点数を線形補間
  const bands = VALUATION_SCORE_BANDS;
  let score: number;

  if (ratio >= bands[0].minRatio) {
    score = bands[0].score;
  } else if (ratio <= bands[bands.length - 1].minRatio) {
    score = bands[bands.length - 1].score;
  } else {
    // 区間を探して線形補間
    score = bands[bands.length - 1].score;
    for (let i = 0; i < bands.length - 1; i++) {
      if (ratio >= bands[i + 1].minRatio) {
        const upper = bands[i];
        const lower = bands[i + 1];
        const t =
          (ratio - lower.minRatio) / (upper.minRatio - lower.minRatio);
        score = Math.round(lower.score + t * (upper.score - lower.score));
        break;
      }
    }
  }

  // ラベル
  let label: string;
  if (ratio >= 1.5) label = "大幅割安";
  else if (ratio >= 1.2) label = "割安";
  else if (ratio >= 0.8) label = "適正";
  else if (ratio >= 0.5) label = "割高";
  else label = "大幅割高";

  return { score, ratio, label };
}

// ── 業種スコア（100点満点） ──

/**
 * 東証33業種の基礎スコア + テーマ補正を100点に正規化。
 * テーマ補正はAI Tier分析時に付与される（ない場合は基礎のみ）。
 */
export function calcIndustryScore(
  industryName: string | null | undefined,
  themeAdjustment?: number // AI分析で付与されるテーマ補正の合計値
): { score: number; baseScore: number; category: string } {
  if (!industryName) {
    return { score: 50, baseScore: 3, category: "不明" };
  }

  const defensive = DEFENSIVE_SCORE[industryName] ?? 3;
  const tariff = TARIFF_RISK_SCORE[industryName] ?? 0;
  const growth = GROWTH_BONUS[industryName] ?? 0;
  const baseScore = defensive + tariff + growth;

  // -3〜15 を 0〜100 に正規化
  const normalized =
    ((baseScore - INDUSTRY_BASE_MIN) / (INDUSTRY_BASE_MAX - INDUSTRY_BASE_MIN)) * 100;

  // テーマ補正を加算（-20〜+15程度を0-100にクランプ）
  const adjusted = Math.max(0, Math.min(100, normalized + (themeAdjustment ?? 0)));

  // カテゴリラベル
  let category: string;
  if (defensive >= 8) category = "ディフェンシブ";
  else if (defensive >= 5) category = "準ディフェンシブ";
  else if (defensive >= 3) category = "シクリカル";
  else category = "高シクリカル";

  return { score: Math.round(adjusted), baseScore, category };
}

// ── 総合スコア ──

export function calcCompositeScore(breakdown: {
  financial: number;
  valuation: number | null;
  industry: number;
}): number {
  const { financial, valuation, industry } = breakdown;

  if (valuation === null) {
    // 割安度が計算できない場合、財務と業種の2軸で按分
    const adjustedWeight =
      SCORE_WEIGHTS.financial /
      (SCORE_WEIGHTS.financial + SCORE_WEIGHTS.industry);
    const adjustedIndustryWeight = 1 - adjustedWeight;
    return Math.round(
      financial * adjustedWeight + industry * adjustedIndustryWeight
    );
  }

  return Math.round(
    financial * SCORE_WEIGHTS.financial +
      valuation * SCORE_WEIGHTS.valuation +
      industry * SCORE_WEIGHTS.industry
  );
}

// ── まとめて計算 ──

export function calcAllScores(stock: {
  financialScoreRaw?: number | null; // 新8項目スコア (0-100)
  totalScore?: number | null; // 旧85点満点スコア（レガシー）
  roe: number | null;
  pbr: number | null;
  industry: string | null;
  themeAdjustment?: number;
}): ScoreBreakdown {
  const financial =
    stock.financialScoreRaw != null
      ? calcFinancialScore(stock.financialScoreRaw, 100)
      : calcFinancialScore(stock.totalScore ?? null, 85);
  const valuationResult = calcValuationScore(stock.roe, stock.pbr);
  const valuation = valuationResult?.score ?? null;
  const { score: industry } = calcIndustryScore(
    stock.industry,
    stock.themeAdjustment
  );
  const composite = calcCompositeScore({ financial, valuation, industry });

  return { financial, valuation, industry, composite };
}
