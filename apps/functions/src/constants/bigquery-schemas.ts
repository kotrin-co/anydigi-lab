export const PROJECT_ID = "sns-query";
export const DATASET_ID = "sns_metrics";
export const LOCATION = "asia-northeast1";
export const SCHEMAS = {
  GOOGLE_TRENDS_RSS: {
    tableId: "google_trends_rss",
    schema: [
      { name: "keyword", type: "STRING", mode: "REQUIRED" },
      { name: "traffic", type: "INTEGER", mode: "NULLABLE" },
      { name: "pub_date", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "picture_url", type: "STRING", mode: "NULLABLE" },
      { name: "picture_source", type: "STRING", mode: "NULLABLE" },
      { name: "region", type: "STRING", mode: "NULLABLE" },
      { name: "news_titles", type: "STRING", mode: "REPEATED" },
      { name: "created_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    partitioning: {
      type: "DAY",
      field: "created_at",
    },
    clustering: {
      fields: ["keyword"],
    },
  },
  RSS_ARTICLES: {
    tableId: "rss_articles",
    schema: [
      { name: "id", type: "STRING", mode: "REQUIRED" },
      { name: "url", type: "STRING", mode: "REQUIRED" },
      { name: "title", type: "STRING", mode: "REQUIRED" },
      { name: "content", type: "STRING", mode: "NULLABLE" },
      { name: "published_at", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "source_name", type: "STRING", mode: "REQUIRED" },
      { name: "source_url", type: "STRING", mode: "REQUIRED" },
      { name: "source_country", type: "STRING", mode: "REQUIRED" },
      { name: "source_category", type: "STRING", mode: "NULLABLE" },
      { name: "language", type: "STRING", mode: "NULLABLE" },
      { name: "created_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    partitioning: {
      type: "DAY",
      field: "published_at",
    },
    clustering: {
      fields: ["source_country", "source_category"],
    },
  },
  POPULAR_VIDEOS: {
    tableId: "popular_videos",
    schema: [
      { name: "snapshot_date", type: "DATE", mode: "REQUIRED" },
      { name: "video_id", type: "STRING", mode: "REQUIRED" },
      { name: "channel_id", type: "STRING", mode: "NULLABLE" },
      {
        name: "channel",
        type: "RECORD",
        mode: "NULLABLE",
        fields: [
          { name: "title", type: "STRING", mode: "NULLABLE" },
          { name: "description", type: "STRING", mode: "NULLABLE" },
          { name: "published_at", type: "TIMESTAMP", mode: "NULLABLE" },
          { name: "thumbnail_url", type: "STRING", mode: "NULLABLE" },
          { name: "custom_url", type: "STRING", mode: "NULLABLE" },
          { name: "region", type: "STRING", mode: "NULLABLE" },
          { name: "view_count", type: "INTEGER", mode: "NULLABLE" },
          { name: "subscriber_count", type: "INTEGER", mode: "NULLABLE" },
          { name: "video_count", type: "INTEGER", mode: "NULLABLE" },
        ],
      },
      {
        name: "basic_info",
        type: "RECORD",
        mode: "NULLABLE",
        fields: [
          { name: "title", type: "STRING", mode: "NULLABLE" },
          { name: "description", type: "STRING", mode: "NULLABLE" },
          { name: "thumbnail_url", type: "STRING", mode: "NULLABLE" },
          { name: "duration", type: "INTEGER", mode: "NULLABLE" },
          { name: "tags", type: "STRING", mode: "REPEATED" },
          { name: "category", type: "STRING", mode: "NULLABLE" },
          { name: "published_at", type: "TIMESTAMP", mode: "NULLABLE" },
        ],
      },
      {
        name: "statistics",
        type: "RECORD",
        mode: "NULLABLE",
        fields: [
          { name: "view_count", type: "INTEGER", mode: "NULLABLE" },
          { name: "like_count", type: "INTEGER", mode: "NULLABLE" },
          { name: "comment_count", type: "INTEGER", mode: "NULLABLE" },
        ],
      },
      { name: "region_code", type: "STRING", mode: "NULLABLE" },
      { name: "created_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    partitioning: {
      type: "DAY",
      field: "snapshot_date",
      expirationMs: "2592000000", // 30 days
    },
    clustering: {
      fields: ["channel_id", "video_id"],
    },
  },
  VIDEO_COMMENTS: {
    tableId: "video_comments",
    schema: [
      { name: "snapshot_date", type: "DATE", mode: "REQUIRED" },
      { name: "video_id", type: "STRING", mode: "REQUIRED" },
      { name: "channel_id", type: "STRING", mode: "NULLABLE" },
      { name: "comment_id", type: "STRING", mode: "NULLABLE" },
      { name: "text", type: "STRING", mode: "NULLABLE" },
      { name: "like_count", type: "INTEGER", mode: "NULLABLE" },
      { name: "published_at", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "reply_count", type: "INTEGER", mode: "NULLABLE" },
      { name: "rank", type: "INTEGER", mode: "NULLABLE" },
      { name: "author_name", type: "STRING", mode: "NULLABLE" },
      { name: "created_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    partitioning: {
      type: "DAY",
      field: "snapshot_date",
      expirationMs: "2592000000", // 30 days
    },
    clustering: {
      fields: ["channel_id", "video_id"],
    },
  },
  REDDIT_POSTS: {
    tableId: "reddit_posts",
    schema: [
      { name: "snapshot_date", type: "DATE", mode: "REQUIRED" },
      { name: "post_id", type: "STRING", mode: "REQUIRED" },
      { name: "subreddit", type: "STRING", mode: "REQUIRED" },
      { name: "title", type: "STRING", mode: "REQUIRED" },
      { name: "selftext", type: "STRING", mode: "NULLABLE" },
      { name: "url", type: "STRING", mode: "NULLABLE" },
      { name: "permalink", type: "STRING", mode: "NULLABLE" },
      { name: "author", type: "STRING", mode: "NULLABLE" },
      { name: "score", type: "INTEGER", mode: "NULLABLE" },
      { name: "upvote_ratio", type: "FLOAT", mode: "NULLABLE" },
      { name: "num_comments", type: "INTEGER", mode: "NULLABLE" },
      { name: "flair", type: "STRING", mode: "NULLABLE" },
      { name: "over_18", type: "BOOLEAN", mode: "NULLABLE" },
      { name: "category", type: "STRING", mode: "NULLABLE" },
      { name: "language", type: "STRING", mode: "NULLABLE" },
      { name: "posted_at", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "stickied", type: "BOOLEAN", mode: "NULLABLE" },
      { name: "created_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    partitioning: {
      type: "DAY",
      field: "snapshot_date",
      expirationMs: "172800000", // 48h
    },
    clustering: {
      fields: ["subreddit", "category"],
    },
  },
};
