import { R2BaseRepository } from "./base-repository";
import * as logger from "firebase-functions/logger";

interface TrendData {
  keyword: string;
  traffic: number | null;
  pubDate: Date | null;
  pictureUrl: string | null;
  pictureSource: string | null;
  region: string;
  newsTitles: string[];
}

export class GoogleTrendsRssRepository extends R2BaseRepository {
  async saveTrends(trends: TrendData[]) {
    try {
      const rows = trends.map((trend) => ({
        keyword: trend.keyword,
        traffic: trend.traffic,
        pub_date: trend.pubDate
          ? this.getTimestamp(trend.pubDate.toISOString())
          : null,
        picture_url: trend.pictureUrl,
        picture_source: trend.pictureSource,
        region: trend.region,
        news_titles: trend.newsTitles,
        created_at: this.getTimestamp(),
      }));

      return await this.insert(this.schemas.GOOGLE_TRENDS_RSS.prefix, rows);
    } catch (error) {
      logger.error("Error saving google trends to R2", { error });
      throw error;
    }
  }
}
