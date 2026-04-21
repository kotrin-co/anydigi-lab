import Parser from "rss-parser";
import * as logger from "firebase-functions/logger";
import { GoogleTrendsRssRepository } from "../repositories/bigquery/google-trends-rss-repository";

const RSS_BASE_URL = "https://trends.google.co.jp/trending/rss?geo=";
const REGIONS = ["JP", "US", "KR"];

interface NewsItem {
  "ht:news_item_title"?: string;
  "ht:news_item_url"?: string;
  "ht:news_item_source"?: string;
}

interface CustomFeedItem {
  ht_approx_traffic?: string;
  title: string;
  pubDate: string;
  traffic?: string;
  picture?: string;
  picture_source?: string;
  "ht:news_item"?: NewsItem[];
}

export class GoogleTrendRssService {
  private readonly parser: Parser<CustomFeedItem> = new Parser({
    customFields: {
      item: [
        ["ht:approx_traffic", "traffic"],
        ["ht:picture", "picture"],
        ["ht:picture_source", "picture_source"],
        ["ht:news_item", "ht:news_item", { keepArray: true }],
      ],
    },
  });
  private readonly repository = new GoogleTrendsRssRepository();

  async execute() {
    for (const region of REGIONS) {
      logger.info(`Fetching Google Trends RSS for region: ${region}`);

      try {
        const url = `${RSS_BASE_URL}${region}`;
        const feed = await this.parser.parseURL(url);

        const dataToSave = feed.items
          .filter((item) => item.title)
          .map((item) => {
            const keyword = item.title as string;
            const trafficStr = item.traffic;
            let traffic: number | null = null;
            if (trafficStr) {
              try {
                traffic = parseInt(trafficStr.replace(/[^\d]/g, ""), 10);
              } catch {
                logger.warn(
                  `Failed to parse traffic for keyword "${keyword}": ${trafficStr}`,
                );
              }
            }

            const pubDate = item.pubDate ? new Date(item.pubDate) : null;
            const pictureUrl = item.picture ?? null;
            const pictureSource = item.picture_source ?? null;

            const newsItems = item["ht:news_item"];
            const newsTitles: string[] = [];
            if (Array.isArray(newsItems)) {
              for (const newsItem of newsItems) {
                const title = newsItem["ht:news_item_title"];
                if (title) {
                  const titleStr = Array.isArray(title) ? title[0] : title;
                  if (titleStr) {
                    newsTitles.push(titleStr);
                  }
                }
              }
            }

            return {
              keyword,
              traffic,
              pubDate,
              pictureUrl,
              pictureSource,
              region,
              newsTitles,
            };
          });

        await this.repository.saveTrends(dataToSave);

        logger.info(`Saved Google Trends RSS for region: ${region}`);
      } catch (error) {
        logger.error(`Error fetching or parsing RSS for region ${region}:`, {
          error,
        });
      }
    }
  }
}
