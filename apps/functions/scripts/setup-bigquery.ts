/**
 * ローカルでの実行方法
 * 1. cd functions
 * 2. gcloud auth application-default login
 * 3. npx ts-node scripts/setup-bigquery.ts
 */

import { BigQuery } from "@google-cloud/bigquery";
import {
  PROJECT_ID,
  DATASET_ID,
  LOCATION,
  SCHEMAS,
} from "../src/constants/bigquery-schemas";

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

async function setup() {
  const dataset = bigquery.dataset(DATASET_ID);
  const [exists] = await dataset.exists();

  if (!exists) {
    await bigquery.createDataset(DATASET_ID, { location: LOCATION });
    console.log(`Dataset ${DATASET_ID} created.`);
  }

  for (const config of Object.values(SCHEMAS)) {
    const table = dataset.table(config.tableId);
    const [tableExists] = await table.exists();

    if (!tableExists) {
      await dataset.createTable(config.tableId, {
        schema: config.schema,
        timePartitioning: config.partitioning,
        clustering: config.clustering,
      });

      console.log(`Table ${config.tableId} created.`);
    } else {
      console.log(`Table ${config.tableId} already exists.`);
    }
  }
}

setup();
