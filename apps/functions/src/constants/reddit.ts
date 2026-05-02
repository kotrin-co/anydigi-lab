export const REDDIT_USER_AGENT = "AnyDigiLabBot/1.0 by /u/AnyDigiLab";
export const REDDIT_BASE_URL = "https://www.reddit.com";
export const REDDIT_REQUEST_INTERVAL_MS = 6000;

export interface RedditSource {
  subreddit: string;
  category: "startup" | "ai" | "business" | "food" | "tech" | "japan";
  language: "en" | "ja";
  sort?: "hot" | "new" | "top";
  limit?: number;
}

export const REDDIT_SOURCES: RedditSource[] = [
  {
    subreddit: "startups",
    category: "startup",
    language: "en",
  },
  {
    subreddit: "Entrepreneur",
    category: "startup",
    language: "en",
  },
  {
    subreddit: "smallbusiness",
    category: "business",
    language: "en",
  },
  {
    subreddit: "SideProject",
    category: "startup",
    language: "en",
  },
  {
    subreddit: "sales",
    category: "business",
    language: "en",
  },
  {
    subreddit: "FoodBusiness",
    category: "food",
    language: "en",
  },
  {
    subreddit: "restauranteur",
    category: "food",
    language: "en",
  },
  {
    subreddit: "artificial",
    category: "ai",
    language: "en",
  },
  {
    subreddit: "MachineLearning",
    category: "ai",
    language: "en",
  },
  {
    subreddit: "LocalLLaMA",
    category: "ai",
    language: "en",
  },
  {
    subreddit: "Japan",
    category: "japan",
    language: "en",
  },
  {
    subreddit: "JapanLife",
    category: "japan",
    language: "en",
  },
];
