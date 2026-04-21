import { YoutubeClient } from "./client";
import * as logger from "firebase-functions/logger";

export class CommentService {
  constructor(private readonly client: YoutubeClient) {}

  async fetchComments(videoId: string) {
    try {
      const res = await this.client.request((api) =>
        api.commentThreads.list({
          part: ["snippet"],
          videoId,
          maxResults: 50,
          order: 'relevance',
          textFormat: 'plainText',
        }),
      );

      return res.data.items ?? [];
    } catch (error) {
      logger.error("Error fetching comments", { error });
      throw error;
    }
  }
}