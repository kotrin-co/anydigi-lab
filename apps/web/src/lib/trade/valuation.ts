/** 残余利益モデル(RIM)ベースの割安度判定 */

const COE = 0.08; // 株主資本コスト 8%
const G = 0.02; // 持続成長率 2%

export type ValueScore = {
  ratio: number;
  fairPbr: number;
  label: string;
  color: string;
};

export function calcValueScore(
  roe: number | null | undefined,
  pbr: number | null | undefined
): ValueScore | null {
  if (!roe || !pbr || pbr <= 0) return null;

  const roeDecimal = roe / 100;
  const fairPbr = Math.max(0.1, 1 + (roeDecimal - COE) / (COE - G));
  const ratio = fairPbr / pbr;

  if (ratio >= 1.5)
    return { ratio, fairPbr, label: "大幅割安", color: "text-emerald-500" };
  if (ratio >= 1.2)
    return { ratio, fairPbr, label: "割安", color: "text-emerald-400" };
  if (ratio >= 0.8)
    return { ratio, fairPbr, label: "適正", color: "text-muted-foreground" };
  if (ratio >= 0.5)
    return { ratio, fairPbr, label: "割高", color: "text-yellow-500" };
  return { ratio, fairPbr, label: "大幅割高", color: "text-red-500" };
}
