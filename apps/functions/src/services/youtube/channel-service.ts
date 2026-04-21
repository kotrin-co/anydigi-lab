import { YoutubeClient } from "./client";
import * as logger from "firebase-functions/logger";

export class ChannelService {
  constructor(private readonly client: YoutubeClient) {}

  async fetchChannels(channelIds: string[]) {
    try {
      if (channelIds.length === 0 || channelIds.length > 50) {
        throw new Error("channelIds must be between 1 and 50");
      }

      const res = await this.client.request((api) =>
        api.channels.list({
          part: ["snippet", "statistics", "contentDetails"],
          id: channelIds,
          maxResults: channelIds.length,
        }),
      );

      return res.data.items ?? [];
    } catch (error) {
      logger.error("Error fetching channels", { error });
      throw error;
    }
  }
}
