import { YoutubeClient } from "./client";
import * as logger from "firebase-functions/logger";

export class VideoCategoryService {
  constructor(private readonly client: YoutubeClient) {}

  async fetchVideoCategories(regionCode: string = "JP") {
    try {
      const res = await this.client.request((api) =>
        api.videoCategories.list({
          part: ["snippet"],
          regionCode,
          hl: "ja",
        }),
      );

      return res.data.items ?? [];
    } catch (error) {
      logger.error("Error fetching video categories", { error });
      throw error;
    }
  }
}
