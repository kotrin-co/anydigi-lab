import { R2BaseRepository } from "./base-repository";
import * as logger from "firebase-functions/logger";
import { RedditPostRaw } from "../../services/reddit-service";
import { RedditSource } from "../../constants/reddit";

export class RedditPostRepository extends R2BaseRepository {
  async savePosts(posts: RedditPostRaw[], source: RedditSource) {
    try {
      const rows = posts.map((post) => ({
        snapshot_date: this.getPartitionDate(),
        post_id: post.data.id,
        subreddit: post.data.subreddit,
        title: post.data.title,
        selftext: post.data.selftext?.slice(0, 5000) ?? null,
        url: post.data.url,
        permalink: `https://reddit.com${post.data.permalink}`,
        author: post.data.author,
        score: post.data.score,
        upvote_ratio: post.data.upvote_ratio,
        num_comments: post.data.num_comments,
        flair: post.data.link_flair_text,
        over_18: post.data.over_18,
        category: source.category,
        language: source.language,
        posted_at: this.getTimestamp(
          new Date(post.data.created_utc * 1000).toISOString(),
        ),
        stickied: post.data.stickied,
        created_at: this.getTimestamp(),
      }));

      return await this.insert(this.schemas.REDDIT_POSTS.prefix, rows);
    } catch (error: any) {
      logger.error("Error saving Reddit posts to R2", { error });
      throw error;
    }
  }
}
