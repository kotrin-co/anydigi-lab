import { YoutubeClient } from "./client";
import * as logger from "firebase-functions/logger";
import { youtube_v3 } from "googleapis";

export class VideoService {
  constructor(private readonly client: YoutubeClient) {}

  async fetchPopularVideos(
    regionCode: string = "JP",
    categoryId?: string,
    maxPages: number = 10,
  ) {
    const allVideos: youtube_v3.Schema$Video[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    try {
      do {
        const res = await this.client.request((api) =>
          api.videos.list({
            part: ["snippet", "statistics", "contentDetails"],
            chart: "mostPopular",
            regionCode,
            maxResults: 50,
            ...(categoryId && { videoCategoryId: categoryId }),
            pageToken,
          }),
        );

        if (res.data.items) {
          allVideos.push(...res.data.items);
        }

        pageToken = res.data.nextPageToken ?? undefined;
        pageCount++;
      } while (pageToken && pageCount < maxPages);
    } catch (error) {
      logger.error("Error fetching popular videos", { error });
      throw error;
    }

    return allVideos;
  }
}
