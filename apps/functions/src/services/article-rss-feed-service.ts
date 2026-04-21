import * as logger from "firebase-functions/logger";
import Parser from "rss-parser";
import { RssArticleRepository } from "../repositories/bigquery";

interface RssFeedSource {
  url: string;
  name: string;
  country: "JP" | "US" | "EU";
  category: "ai" | "dx" | "startup" | "general_tech";
  language: "ja" | "en";
}

const RSS_SOURCES: RssFeedSource[] = [
  // JP
  {
    url: "https://xtech.nikkei.com/rss/xtech-it.rdf",
    name: "nikkei_xtech_it",
    country: "JP",
    category: "general_tech",
    language: "ja",
  },
  {
    url: "https://xtech.nikkei.com/rss/xtech-mono.rdf",
    name: "nikkei_xtech_mono",
    country: "JP",
    category: "dx",
    language: "ja",
  },
  {
    url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
    name: "itmedia_ai",
    country: "JP",
    category: "ai",
    language: "ja",
  },
  {
    url: "https://rss.itmedia.co.jp/rss/2.0/enterprise.xml",
    name: "itmedia_enterprise",
    country: "JP",
    category: "general_tech",
    language: "ja",
  },
  {
    url: "https://prtimes.jp/index.rdf",
    name: "prtimes",
    country: "JP",
    category: "general_tech",
    language: "ja",
  },
  {
    url: "https://news.yahoo.co.jp/rss/topics/it.xml",
    name: "yahoo_news_it",
    country: "JP",
    category: "general_tech",
    language: "ja",
  },
  {
    url: "https://www.publickey1.jp/atom.xml",
    name: "publickey",
    country: "JP",
    category: "dx",
    language: "ja",
  },
  {
    url: "https://zenn.dev/feed",
    name: "zenn",
    country: "JP",
    category: "general_tech",
    language: "ja",
  },

  // US
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    name: "techcrunch_ai",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://techcrunch.com/category/startups/feed/",
    name: "techcrunch_startups",
    country: "US",
    category: "startup",
    language: "en",
  },
  {
    url: "https://openai.com/news/rss.xml",
    name: "openai_blog",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://deepmind.google/blog/rss.xml",
    name: "deepmind_blog",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://www.technologyreview.com/feed/",
    name: "mit_tech_review",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    name: "the_verge_ai",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    name: "venturebeat_ai",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://www.wired.com/feed/rss",
    name: "wired",
    country: "US",
    category: "general_tech",
    language: "en",
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/index",
    name: "ars_technica",
    country: "US",
    category: "general_tech",
    language: "en",
  },
  {
    url: "https://importai.substack.com/feed",
    name: "import_ai",
    country: "US",
    category: "ai",
    language: "en",
  },
  {
    url: "https://hnrss.org/frontpage",
    name: "hacker_news",
    country: "US",
    category: "general_tech",
    language: "en",
  },

  // EU
  {
    url: "https://tech.eu/feed/",
    name: "tech_eu",
    country: "EU",
    category: "startup",
    language: "en",
  },
  {
    url: "https://sifted.eu/feed",
    name: "sifted_eu",
    country: "EU",
    category: "startup",
    language: "en",
  },
];

export class ArticleRssFeedService {
  private readonly repository = new RssArticleRepository();
  private parser: Parser = new Parser();

  async execute() {
    try {
      logger.info("ArticleRssFeedService start");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      for (const source of RSS_SOURCES) {
        try {
          const feed = await this.parser.parseURL(source.url);
          const rows = feed.items
            .filter((item) => {
              if (!item.title || !item.link) return false;
              if (item.isoDate && new Date(item.isoDate) < cutoffDate)
                return false;
              return true;
            })
            .map((item) => ({
              url: item.link!,
              title: item.title!,
              content: item.contentSnippet ?? null,
              publishedAt: item.isoDate ?? null,
              sourceName: source.name,
              sourceUrl: source.url,
              sourceCountry: source.country,
              sourceCategory: source.category,
              language: source.language,
            }));

          await this.repository.saveArticles(rows);

          logger.info(
            `${source.name}(${source.url}), ${rows.length}件の取得完了`,
          );
        } catch (error) {
          logger.error(`${source.name}(${source.url})の取得に失敗しました`, {
            error,
          });
          continue;
        }
      }
    } catch (error) {
      logger.error("ArticleRssFeedService エラー", { error });
    }
  }
}
