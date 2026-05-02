export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
export const R2_BUCKET = process.env.R2_BUCKET!;

export const SCHEMAS = {
  RSS_ARTICLES: {
    prefix: "rss/articles",
    retentionDays: null,
  },
  GOOGLE_TRENDS_RSS: {
    prefix: "google_trends/rss",
    retentionDays: null,
  },
  POPULAR_VIDEOS: {
    prefix: "youtube/popular_videos",
    retentionDays: 30,
  },
  YOUTUBE_COMMENTS: {
    prefix: "youtube/comments",
    retentionDays: 30,
  },
  REDDIT_POSTS: {
    prefix: "reddit/posts",
    retentionDays: null,
  },
} as const;
