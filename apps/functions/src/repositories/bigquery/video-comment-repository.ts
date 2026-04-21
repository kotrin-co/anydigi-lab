import { BaseRepository } from "./base-repository";
import { youtube_v3 } from "googleapis";
import * as logger from "firebase-functions/logger";

export class VideoCommentRepository extends BaseRepository {
  async saveComments(comments: youtube_v3.Schema$CommentThread[]) {
    try {
      const rows = comments
        .filter((comment) => comment.snippet?.videoId)
        .map((comment, index) => {
          const tlComment = comment.snippet?.topLevelComment;
          const videoId = comment.snippet?.videoId;
          const channelId = comment?.snippet?.channelId ?? null;

          return {
            snapshot_date: this.getSnapshotDate(),
            video_id: videoId,
            channel_id: channelId,
            comment_id: tlComment?.id,
            text: tlComment?.snippet?.textDisplay,
            like_count: tlComment?.snippet?.likeCount,
            published_at: tlComment?.snippet?.publishedAt
              ? this.getTimestamp(tlComment.snippet.publishedAt)
              : null,
            reply_count: comment.snippet?.totalReplyCount ?? null,
            rank: index + 1,
            author_name: tlComment?.snippet?.authorDisplayName,
            created_at: this.getTimestamp(),
          };
        });

      return await this.insert(this.schemas.VIDEO_COMMENTS.tableId, rows);
    } catch (error) {
      logger.error("Error saving comments to BigQuery", { error });
      throw error;
    }
  }
}
