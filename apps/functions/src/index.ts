import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
// import { DevSavePopularVideos } from "./dev/save-popular-videos";
import {
  PopularVideosService,
  GoogleTrendRssService,
  ArticleRssFeedService,
} from "./services";
import { withMetrics } from "./utils";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export const dev = onRequest(
  {
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 900,
  },
  async (request, response) => {
    if (!process.env.FUNCTIONS_EMULATOR) {
      response.status(403).json({ error: "Emulator only" });
      return;
    }

    const service = new ArticleRssFeedService();
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
    await withMetrics("popularVideosScheduler", async () => {
      const service = new PopularVideosService();
      await service.execute();
    });
  },
);

export const googleTrendsRssScheduler = onSchedule(
  {
    schedule: "*/15 * * * *",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 60,
    retryCount: 0,
    timeZone: "Asia/Tokyo",
  },
  async () => {
    await withMetrics("googleTrendsRssScheduler", async () => {
      const service = new GoogleTrendRssService();
      await service.execute();
    });
  },
);

export const articleRssFeedScheduler = onSchedule(
  {
    schedule: "*/15 * * * *",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 180,
    retryCount: 0,
    timeZone: "Asia/Tokyo",
  },
  async () => {
    await withMetrics("articleRssFeedScheduler", async () => {
      const service = new ArticleRssFeedService();
      await service.execute();
    });
  },
);
