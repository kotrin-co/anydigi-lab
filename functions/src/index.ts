import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { DevSavePopularVideos } from "./dev/save-popular-videos";
import { PopularVideosService } from './services/popular-videos-service';
import * as logger from "firebase-functions/logger";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export const dev = onRequest(
  {
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 900,
  },
  async (request, response) => {
    const service = new DevSavePopularVideos();
    await service.execute();

    response.json({ success: true });
  },
);

export const popularVideosScheduler = onSchedule(
  {
    schedule: "0 6 * * *",
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 1800,
    retryCount: 0,
    timeZone: "Asia/Tokyo",
  },
  async () => {
    // 全体の計測開始
    const startTime = performance.now();

    try {
      const service = new PopularVideosService();
      await service.execute();
    } finally {
      // 全体の計測終了
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // 秒に変換

      const memory = process.memoryUsage();
      const heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2); // MB変換
      const rss = (memory.rss / 1024 / 1024).toFixed(2); // MB変換

      logger.info("処理終了", {
        durationSeconds: duration.toFixed(2), // 実行時間(秒)
        heapUsedMB: heapUsed, // JSオブジェクトが使用しているメモリ
        rssMB: rss, // プロセス全体が使用しているメモリ
      });
    }
  },
);
