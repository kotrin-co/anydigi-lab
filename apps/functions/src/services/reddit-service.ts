import * as logger from "firebase-functions/logger";
import {
  REDDIT_SOURCES,
  REDDIT_BASE_URL,
  REDDIT_REQUEST_INTERVAL_MS,
  REDDIT_USER_AGENT,
  type RedditSource,
} from "../constants/reddit";
import { RedditPostRepository } from "../repositories/r2";

export interface RedditPostRaw {
  data: {
    id: string;
    subreddit: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    author: string;
    score: number;
    upvote_ratio: number;
    num_comments: number;
    link_flair_text: string | null;
    over_18: boolean;
    stickied: boolean;
    created_utc: number;
  };
}

export class RedditService {
  private readonly redditRepository = new RedditPostRepository();

  async execute() {
    logger.info("RedditService started");

    for (const source of REDDIT_SOURCES) {
      try {
        const posts = await this.fetchSubreddit(source);
        await this.redditRepository.savePosts(posts, source);

        logger.info(`r/${source.subreddit} 取得成功`, { count: posts.length });
      } catch (error) {
        logger.error(`r/${source.subreddit} 取得失敗`, { error });
      }

      await this.wait(REDDIT_REQUEST_INTERVAL_MS);
    }
  }

  private async fetchSubreddit(source: RedditSource) {
    const sort = source.sort ?? "hot";
    const limit = source.limit ?? 100;
    const url = `${REDDIT_BASE_URL}/r/${source.subreddit}/${sort}.json?limit=${limit}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": REDDIT_USER_AGENT,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(`Reddit API error on ${url}`, {
        status: res.status,
        body,
      });
      throw new Error(
        `Reddit API ${res.status} on ${url}: ${body.slice(0, 200)}`,
      );
    }

    const json = (await res.json()) as {
      data: {
        children: RedditPostRaw[];
      };
    };

    return json.data.children;
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
