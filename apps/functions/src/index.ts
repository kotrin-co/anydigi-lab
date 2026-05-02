import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  PopularVideosService,
  GoogleTrendRssService,
  ArticleRssFeedService,
  RedditService,
} from "./services";
import { DuckdbTestService } from "./dev/duckdb-test";
import { withMetrics } from "./utils";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export const dev = onRequest(
  {
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 3600,
  },
  async (request, response) => {
    if (!process.env.FUNCTIONS_EMULATOR) {
      response.status(403).json({ error: "Emulator only" });
      return;
    }

    const service = new DuckdbTestService();
    // const service = new RedditService();
    const result = await service.execute();

    response.json({ success: true, result });
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
    schedule: "0 */3 * * *",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 180,
    retryCount: 1,
    timeZone: "Asia/Tokyo",
  },
  async () => {
    await withMetrics("articleRssFeedScheduler", async () => {
      const service = new ArticleRssFeedService();
      await service.execute();
    });
  },
);

export const redditScheduler = onSchedule(
  {
    schedule: "30 5 * * *",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 180,
    retryCount: 0,
    timeZone: "Asia/Tokyo",
  },
  async () => {
    await withMetrics("redditScheduler", async () => {
      const service = new RedditService();
      await service.execute();
    });
  },
);
