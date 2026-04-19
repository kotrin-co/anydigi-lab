/**
 * 8項目財務スコアリング（100点満点）
 *
 * IRバンクの10年財務データから以下を評価:
 * 1. 売上高トレンド (0-15)
 * 2. EPS (0-15)
 * 3. 営業利益率 (0-15)
 * 4. 自己資本比率 (0-10)
 * 5. 営業CF (0-15)
 * 6. 現金等 (0-5)
 * 7. 1株配当金 (0-15)
 * 8. 配当性向 (0-10)
 */

export type YearlyData = {
  fiscalYear: string;
  revenue: number | null;
  eps: number | null;
  operatingMargin: number | null;
  equityRatio: number | null;
  operatingCf: number | null;
  cashEquivalents: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
};

export type ScoreItem = {
  score: number;
  max: number;
  detail: string;
};

export type FinancialScoreResult = {
  revenueTrend: ScoreItem;
  epsTrend: ScoreItem;
  operatingMargin: ScoreItem;
  equityRatio: ScoreItem;
  operatingCf: ScoreItem;
  cashTrend: ScoreItem;
  dividendTrend: ScoreItem;
  payoutRatio: ScoreItem;
  total: number;
  disqualified: boolean;
  disqualifiedReason: string | null;
  lossYears: number;
  dividendHistoryYears: number;
  specialDividendSuspected: boolean;
};

const FINANCIAL_SECTOR_INDUSTRIES = [
  "銀行業",
  "保険業",
  "証券業",
  "証券・商品先物取引業",
  "その他金融業",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 有効な数値だけ抽出 */
function validNumbers(
  data: YearlyData[],
  key: keyof Omit<YearlyData, "fiscalYear">
): number[] {
  return data
    .map((d) => d[key])
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
}

/** CAGR（年複利成長率） */
function calcCAGR(values: number[]): number | null {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  if (first <= 0 || last <= 0) return null;
  const years = values.length - 1;
  return Math.pow(last / first, 1 / years) - 1;
}

/** YoY変化で減少した年数をカウント */
function countDeclineYears(values: number[]): number {
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) count++;
  }
  return count;
}

/** 変動係数 (CV) */
function calcCV(values: number[]): number {
  if (values.length < 2) return 0;
  const yoyChanges: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      yoyChanges.push((values[i] - values[i - 1]) / Math.abs(values[i - 1]));
    }
  }
  if (yoyChanges.length === 0) return 0;
  const mean = yoyChanges.reduce((a, b) => a + b, 0) / yoyChanges.length;
  const variance =
    yoyChanges.reduce((a, b) => a + (b - mean) ** 2, 0) / yoyChanges.length;
  return mean === 0 ? 0 : Math.sqrt(variance) / Math.abs(mean);
}

/** 直近から連続で増加している年数 */
function consecutiveIncreaseYears(values: number[]): number {
  let count = 0;
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i] > values[i - 1]) count++;
    else break;
  }
  return count;
}

// ── 1. 売上高トレンド (0-15) ──

export function scoreRevenueTrend(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "revenue");
  if (values.length < 3) return { score: 0, max: 15, detail: "データ不足" };

  const cagr = calcCAGR(values);
  const declines = countDeclineYears(values);
  const cv = calcCV(values);

  let base: number;
  if (cagr === null) {
    base = 5;
  } else if (cagr >= 0.1) {
    base = 15;
  } else if (cagr >= 0.08) {
    base = 12;
  } else if (cagr >= 0.05) {
    base = 10;
  } else if (cagr >= 0) {
    base = 7;
  } else {
    base = 3;
  }

  const penalty = Math.min(declines, 5) + (cv > 0.3 ? 2 : 0);
  const score = clamp(base - penalty, 0, 15);
  const cagrPct = cagr !== null ? (cagr * 100).toFixed(1) : "N/A";

  return {
    score,
    max: 15,
    detail: `CAGR ${cagrPct}%, 減収${declines}年`,
  };
}

// ── 2. EPS (0-15) ──

export function scoreEpsTrend(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "eps");
  if (values.length < 3) return { score: 0, max: 15, detail: "データ不足" };

  const negativeYears = values.filter((v) => v < 0).length;
  const streak = consecutiveIncreaseYears(values);

  // 線形回帰の傾き
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const slopeRatio = meanY === 0 ? 0 : slope / Math.abs(meanY);

  let base: number;
  if (negativeYears >= 3) {
    base = 0;
  } else if (slopeRatio > 0.1) {
    base = 12;
  } else if (slope > 0) {
    base = 8;
  } else {
    base = 4;
  }

  const streakBonus = streak >= 5 ? 3 : streak >= 3 ? 1 : 0;
  const negativePenalty = Math.min(negativeYears, 3) * 2;
  const score = clamp(base + streakBonus - negativePenalty, 0, 15);

  return {
    score,
    max: 15,
    detail: `連続増益${streak}年, 赤字${negativeYears}年`,
  };
}

// ── 3. 営業利益率 (0-15) ──

export function scoreOperatingMargin(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "operatingMargin");
  if (values.length < 3)
    return { score: 0, max: 15, detail: "データ不足" };

  // 直近3年平均
  const recent = values.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  // 全期間平均
  const fullAvg = values.reduce((a, b) => a + b, 0) / values.length;

  let score: number;
  if (avg >= 15) score = 15;
  else if (avg >= 10) score = 12;
  else if (avg >= 7) score = 9;
  else if (avg >= 5) score = 6;
  else if (avg >= 3) score = 3;
  else score = 0;

  // 改善トレンドボーナス
  if (avg > fullAvg && score < 15) score += 1;

  score = clamp(score, 0, 15);

  return {
    score,
    max: 15,
    detail: `直近3年平均 ${avg.toFixed(1)}%`,
  };
}

// ── 4. 自己資本比率 (0-10) ──

export function scoreEquityRatio(
  data: YearlyData[],
  industry?: string | null
): ScoreItem {
  const values = validNumbers(data, "equityRatio");
  if (values.length === 0)
    return { score: 0, max: 10, detail: "データ不足" };

  const latest = values[values.length - 1];
  const isFinancial = industry
    ? FINANCIAL_SECTOR_INDUSTRIES.includes(industry)
    : false;

  let score: number;
  if (isFinancial) {
    if (latest >= 10) score = 10;
    else if (latest >= 7) score = 8;
    else if (latest >= 5) score = 6;
    else if (latest >= 3) score = 4;
    else score = 0;
  } else {
    if (latest >= 80) score = 10;
    else if (latest >= 60) score = 8;
    else if (latest >= 50) score = 6;
    else if (latest >= 40) score = 4;
    else if (latest >= 30) score = 2;
    else score = 0;
  }

  return {
    score,
    max: 10,
    detail: `直近 ${latest.toFixed(1)}%${isFinancial ? " (金融)" : ""}`,
  };
}

// ── 5. 営業CF (0-15) ──

export function scoreOperatingCf(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "operatingCf");
  if (values.length < 3) return { score: 0, max: 15, detail: "データ不足" };

  const negativeYears = values.filter((v) => v < 0).length;

  // 線形回帰の傾き
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const slopeRatio = meanY === 0 ? 0 : slope / Math.abs(meanY);

  let base: number;
  if (negativeYears === 0) base = 10;
  else if (negativeYears === 1) base = 7;
  else if (negativeYears === 2) base = 4;
  else base = 1;

  const trendBonus =
    slopeRatio > 0.05 ? 3 : slope > 0 ? 2 : 0;
  const score = clamp(base + trendBonus, 0, 15);

  return {
    score,
    max: 15,
    detail: `赤字${negativeYears}年, 傾向${slope > 0 ? "増加" : "横ばい/減少"}`,
  };
}

// ── 6. 現金等 (0-5) ──

export function scoreCashTrend(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "cashEquivalents");
  if (values.length < 2) return { score: 0, max: 5, detail: "データ不足" };

  // 5年前との比較（なければ最古）
  const compareIdx = Math.max(0, values.length - 6);
  const older = values[compareIdx];
  const latest = values[values.length - 1];

  if (older <= 0) return { score: 3, max: 5, detail: "基準値ゼロ以下" };

  const changeRate = (latest - older) / older;

  let score: number;
  if (changeRate >= 0.5) score = 5;
  else if (changeRate >= 0.2) score = 4;
  else if (changeRate > 0) score = 3;
  else if (changeRate >= -0.1) score = 2;
  else if (changeRate >= -0.3) score = 1;
  else score = 0;

  return {
    score,
    max: 5,
    detail: `${(changeRate * 100).toFixed(0)}% 変化`,
  };
}

// ── 7. 1株配当金 (0-15) ──

export function scoreDividendTrend(data: YearlyData[]): {
  item: ScoreItem;
  dividendHistoryYears: number;
  specialDividendSuspected: boolean;
} {
  const values = validNumbers(data, "dividendPerShare");
  if (values.length < 3)
    return {
      item: { score: 0, max: 15, detail: "データ不足" },
      dividendHistoryYears: 0,
      specialDividendSuspected: false,
    };

  let reductions = 0;
  let specialDividendSuspected = false;
  // 特配チェックは直近5年のみ（古い年度は株式分割等の影響を受けやすい）
  const recentStart = Math.max(1, values.length - 5);
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      reductions++;
      if (i >= recentStart && i >= 2 && values[i - 1] > values[i - 2] * 1.5) {
        specialDividendSuspected = true;
      }
    }
  }

  const streak = consecutiveIncreaseYears(values);

  let base: number;
  if (reductions === 0) base = 10;
  else if (reductions === 1) base = 7;
  else if (reductions === 2) base = 4;
  else base = 2;

  const streakBonus = streak >= 10 ? 5 : streak >= 5 ? 3 : streak >= 3 ? 1 : 0;
  const score = clamp(base + streakBonus, 0, 15);

  return {
    item: {
      score,
      max: 15,
      detail: `連続増配${streak}年, 減配${reductions}回`,
    },
    dividendHistoryYears: streak,
    specialDividendSuspected,
  };
}

// ── 8. 配当性向 (0-10) ──

export function scorePayoutRatio(data: YearlyData[]): ScoreItem {
  const values = validNumbers(data, "payoutRatio").filter(
    (v) => v > 0 && v <= 100
  );
  if (values.length < 2) return { score: 0, max: 10, detail: "データ不足" };

  // 直近3年平均（異常値除外済み）
  const recent = values.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  let score: number;
  if (avg >= 30 && avg <= 50) score = 10;
  else if ((avg >= 20 && avg < 30) || (avg > 50 && avg <= 60)) score = 7;
  else if (avg > 60 && avg <= 70) score = 5;
  else if ((avg >= 10 && avg < 20) || (avg > 70 && avg <= 80)) score = 3;
  else if (avg < 10 || avg > 80) score = 1;
  else score = 0;

  return {
    score,
    max: 10,
    detail: `直近3年平均 ${avg.toFixed(1)}%`,
  };
}

// ── まとめて計算 ──

export function calcFinancialScores(
  data: YearlyData[],
  industry?: string | null
): FinancialScoreResult {
  const rev = scoreRevenueTrend(data);
  const eps = scoreEpsTrend(data);
  const margin = scoreOperatingMargin(data);
  const equity = scoreEquityRatio(data, industry);
  const cf = scoreOperatingCf(data);
  const cash = scoreCashTrend(data);
  const div = scoreDividendTrend(data);
  const payout = scorePayoutRatio(data);

  const total =
    rev.score +
    eps.score +
    margin.score +
    equity.score +
    cf.score +
    cash.score +
    div.item.score +
    payout.score;

  // 赤字年数
  const epsValues = validNumbers(data, "eps");
  const lossYears = epsValues.filter((v) => v < 0).length;

  // 営業利益率（直近3年平均）
  const marginValues = validNumbers(data, "operatingMargin");
  const recentMargin =
    marginValues.length >= 3
      ? marginValues.slice(-3).reduce((a, b) => a + b, 0) / 3
      : marginValues.length > 0
        ? marginValues[marginValues.length - 1]
        : null;

  // 配当性向（直近）
  const payoutValues = validNumbers(data, "payoutRatio");
  const latestPayout =
    payoutValues.length > 0 ? payoutValues[payoutValues.length - 1] : null;

  // 営業CF赤字（直近5年）
  const cfValues = validNumbers(data, "operatingCf");
  const recentCfNegative = cfValues.slice(-5).filter((v) => v < 0).length;

  // 失格判定
  const isFinancial = industry
    ? FINANCIAL_SECTOR_INDUSTRIES.includes(industry)
    : false;

  let disqualified = false;
  let disqualifiedReason: string | null = null;

  if (lossYears >= 3) {
    disqualified = true;
    disqualifiedReason = `赤字${lossYears}期`;
  } else if (!isFinancial && recentMargin !== null && recentMargin < 3) {
    disqualified = true;
    disqualifiedReason = `営業利益率${recentMargin.toFixed(1)}%`;
  } else if (latestPayout !== null && latestPayout > 100) {
    disqualified = true;
    disqualifiedReason = `配当性向${latestPayout.toFixed(0)}%`;
  } else if (recentCfNegative >= 3) {
    disqualified = true;
    disqualifiedReason = `直近5年で営業CF赤字${recentCfNegative}回`;
  }

  return {
    revenueTrend: rev,
    epsTrend: eps,
    operatingMargin: margin,
    equityRatio: equity,
    operatingCf: cf,
    cashTrend: cash,
    dividendTrend: div.item,
    payoutRatio: payout,
    total,
    disqualified,
    disqualifiedReason,
    lossYears,
    dividendHistoryYears: div.dividendHistoryYears,
    specialDividendSuspected: div.specialDividendSuspected,
  };
}
