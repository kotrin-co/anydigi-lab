import * as logger from "firebase-functions/logger";
import { R2BaseRepository } from "../repositories/r2/base-repository";
import { SCHEMAS } from "../constants/r2";

class DuckdbTestRepository extends R2BaseRepository {
  async run<T = unknown>(sql: string): Promise<T[]> {
    return this.query<T>(sql);
  }
}

export class DuckdbTestService {
  private readonly repository = new DuckdbTestRepository();

  async execute() {
    const bucket = process.env.R2_BUCKET!;
    const path = `s3://${bucket}/${SCHEMAS.REDDIT_POSTS.prefix}/dt=*/*.parquet`;

    logger.info("[duckdb-test] start", { path });

    const total = await this.repository.run<{ count: number }>(`
      SELECT count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
    `);
    logger.info("[duckdb-test] total", { total });

    const byCategory = await this.repository.run(`
      SELECT category, count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
      GROUP BY category
      ORDER BY count DESC
    `);
    logger.info("[duckdb-test] by category", { byCategory });

    const byLanguage = await this.repository.run(`
      SELECT language, count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
      GROUP BY language
      ORDER BY count DESC
    `);
    logger.info("[duckdb-test] by language", { byLanguage });

    const bySubreddit = await this.repository.run(`
      SELECT subreddit, count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
      GROUP BY subreddit
      ORDER BY count DESC
      LIMIT 20
    `);
    logger.info("[duckdb-test] by subreddit", { bySubreddit });

    const topScore = await this.repository.run(`
      SELECT
        post_id,
        subreddit,
        author,
        score,
        upvote_ratio,
        num_comments,
        substr(title, 1, 80) AS title_preview
      FROM read_parquet('${path}', hive_partitioning=true)
      WHERE score IS NOT NULL
      ORDER BY score DESC
      LIMIT 10
    `);
    logger.info("[duckdb-test] top score", { topScore });

    const topComments = await this.repository.run(`
      SELECT
        post_id,
        subreddit,
        num_comments,
        score,
        substr(title, 1, 80) AS title_preview
      FROM read_parquet('${path}', hive_partitioning=true)
      WHERE num_comments IS NOT NULL
      ORDER BY num_comments DESC
      LIMIT 10
    `);
    logger.info("[duckdb-test] top comments", { topComments });

    const flairTop = await this.repository.run(`
      SELECT flair, count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
      WHERE flair IS NOT NULL
      GROUP BY flair
      ORDER BY count DESC
      LIMIT 10
    `);
    logger.info("[duckdb-test] flair top", { flairTop });

    const recent = await this.repository.run(`
      SELECT
        post_id,
        subreddit,
        author,
        posted_at,
        score,
        substr(title, 1, 80) AS title_preview
      FROM read_parquet('${path}', hive_partitioning=true)
      WHERE posted_at IS NOT NULL
      ORDER BY posted_at DESC
      LIMIT 10
    `);
    logger.info("[duckdb-test] recent posts", { recent });

    const partitions = await this.repository.run(`
      SELECT dt, count(*)::INT AS count
      FROM read_parquet('${path}', hive_partitioning=true)
      GROUP BY dt
      ORDER BY dt DESC
    `);
    logger.info("[duckdb-test] partitions", { partitions });

    const schema = await this.repository.run(`
      DESCRIBE
      SELECT * FROM read_parquet('${path}', hive_partitioning=true)
      LIMIT 0
    `);
    logger.info("[duckdb-test] schema", { schema });

    return {
      total,
      byCategory,
      byLanguage,
      bySubreddit,
      topScore,
      topComments,
      flairTop,
      recent,
      partitions,
      schema,
    };
  }
}
