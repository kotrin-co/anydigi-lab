/**
 * ISO 8601 の期間文字列を秒数（number）に変換する関数です。
 * 対応例:
 *   - PT15M33S   -> 15分33秒
 *   - PT1H30M45S -> 1時間30分45秒
 *   - P2DT3H4M5S -> 2日3時間4分5秒
 *   - P1D        -> 1日のみ
 */
export function parseDuration(duration: string): number | null {
  try {
    // 正規表現でP、D、T、H、M、Sをパースします
    const pattern =
      /^P(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/;

    const match = duration.match(pattern);
    if (!match || !match.groups) {
      return null;
    }

    const days = match.groups.days ? parseInt(match.groups.days, 10) : 0;
    const hours = match.groups.hours ? parseInt(match.groups.hours, 10) : 0;
    const minutes = match.groups.minutes
      ? parseInt(match.groups.minutes, 10)
      : 0;
    const seconds = match.groups.seconds
      ? parseInt(match.groups.seconds, 10)
      : 0;

    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    return totalSeconds;
  } catch {
    return null;
  }
}

/**
 * 関数の実行時間とメモリ使用量を計測してログ出力するラッパー
 */
export async function withMetrics(
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  const { logger } = await import("firebase-functions");
  const startTime = performance.now();

  try {
    await fn();
  } finally {
    const duration = (performance.now() - startTime) / 1000;
    const memory = process.memoryUsage();

    logger.info(`${name} 処理終了`, {
      durationSeconds: duration.toFixed(2),
      heapUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (memory.rss / 1024 / 1024).toFixed(2),
    });
  }
}

export const getChunks = (arr: any[], chunkSize: number = 50) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }

  return chunks;
};
