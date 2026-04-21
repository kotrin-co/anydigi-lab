import { BigQuery } from "@google-cloud/bigquery";
import {
  DATASET_ID,
  LOCATION,
  SCHEMAS,
  PROJECT_ID,
} from "../../constants/bigquery-schemas";

export class BaseRepository {
  protected bq: BigQuery = new BigQuery({
    projectId: PROJECT_ID,
    location: LOCATION,
  });
  protected projectId = PROJECT_ID;
  protected datasetId = DATASET_ID;
  protected schemas = SCHEMAS;
  protected location = LOCATION;

  protected getTableName(tableId: string) {
    return `${this.projectId}.${this.datasetId}.${tableId}`;
  }

  protected async query<T = any>(
    query: string,
    params: Record<string, any>,
  ): Promise<[T[], ...unknown[]]> {
    return await this.bq.query({
      query,
      location: this.location,
      params,
    });
  }

  protected async insert(tableId: string, rows: Record<string, any>[]) {
    if (rows.length === 0) return;

    return await this.bq
      .dataset(this.datasetId)
      .table(tableId)
      .insert(rows, { skipInvalidRows: true });
  }

  protected getSnapshotDate() {
    return BigQuery.date(new Date().toISOString().split("T")[0]);
  }

  protected getTimestamp(dateStr?: string) {
    return dateStr
      ? BigQuery.timestamp(new Date(dateStr))
      : BigQuery.timestamp(new Date());
  }
}
