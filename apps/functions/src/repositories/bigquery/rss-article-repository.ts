import { BaseRepository } from "./base-repository";
import * as logger from "firebase-functions/logger";
import crypto from "crypto";

interface ArticleData {
  url: string;
  title: string;
  content: string | null;
  publishedAt: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceCountry: "JP" | "US" | "EU";
  sourceCategory: "ai" | "dx" | "startup" | "general_tech" | "food";
  language: "ja" | "en";
}

export class RssArticleRepository extends BaseRepository {
  async saveArticles(articles: ArticleData[]) {
    try {
      const rows = articles.map((article) => ({
        id: crypto.createHash("sha256").update(article.url).digest("hex"),
        url: article.url,
        title: article.title,
        content: article.content,
        published_at: article.publishedAt
          ? this.getTimestamp(article.publishedAt)
          : null,
        source_name: article.sourceName,
        source_url: article.sourceUrl,
        source_country: article.sourceCountry,
        source_category: article.sourceCategory,
        language: article.language,
        created_at: this.getTimestamp(),
      }));

      return await this.insert(this.schemas.RSS_ARTICLES.tableId, rows);
    } catch (error: any) {
      if (error.name === "PartialFailureError") {
        const firstErrors = error.errors.slice(0, 3);
        logger.error("BQ partial failure (first 3)", { errors: firstErrors });
      } else {
        logger.error("Error saving RSS articles to BigQuery", { error });
      }
      throw error;
    }
  }
}
