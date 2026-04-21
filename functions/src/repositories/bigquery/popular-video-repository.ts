import { BaseRepository } from "./base-repository";
import { youtube_v3 } from "googleapis";
import * as logger from "firebase-functions/logger";
import { parseDuration } from "../../utils";
export class PopularVideoRepository extends BaseRepository {
  async saveVideos(
    region: string,
    category: string,
    videos: youtube_v3.Schema$Video[],
    channels: Map<string, youtube_v3.Schema$Channel>,
  ) {
    try {
      const rows = videos
        .filter((video) => video.id)
        .map((video) => {
          const channel = channels.get(video.snippet?.channelId ?? "") ?? null;
          const channelData = {
            title: channel?.snippet?.title,
            description: channel?.snippet?.description,
            published_at: channel?.snippet?.publishedAt
              ? this.getTimestamp(channel.snippet.publishedAt)
              : null,
            thumbnail_url: channel?.snippet?.thumbnails?.default?.url,
            custom_url: channel?.snippet?.customUrl,
            region: channel?.snippet?.country,
            view_count: channel?.statistics?.viewCount
              ? parseInt(channel.statistics.viewCount)
              : null,
            subscriber_count: channel?.statistics?.subscriberCount
              ? parseInt(channel.statistics.subscriberCount)
              : null,
            video_count: channel?.statistics?.videoCount
              ? parseInt(channel.statistics.videoCount)
              : null,
          };
          return {
            snapshot_date: this.getSnapshotDate(),
            video_id: video.id,
            channel_id: video.snippet?.channelId ?? null,
            channel: channelData,
            basic_info: {
              title: video.snippet?.title,
              description: video.snippet?.description,
              thumbnail_url: video.snippet?.thumbnails?.default?.url,
              duration: video.contentDetails?.duration
                ? parseDuration(video.contentDetails.duration)
                : null,
              tags: video.snippet?.tags ?? [],
              category,
              published_at: video.snippet?.publishedAt
                ? this.getTimestamp(video.snippet.publishedAt)
                : null,
            },
            statistics: {
              view_count: video.statistics?.viewCount
                ? parseInt(video.statistics.viewCount)
                : null,
              like_count: video.statistics?.likeCount
                ? parseInt(video.statistics.likeCount)
                : null,
              comment_count: video.statistics?.commentCount
                ? parseInt(video.statistics.commentCount)
                : null,
            },
            region_code: region,
            created_at: this.getTimestamp(),
          };
        });

      return await this.insert(this.schemas.POPULAR_VIDEOS.tableId, rows);
    } catch (error) {
      logger.error("Error saving popular videos to BigQuery", { error });
      throw error;
    }
  }
}
