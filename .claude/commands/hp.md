---
name: hp
description: AnyDigi HPの前日アクセス分析（GA4 BigQuery → Neon蓄積）
---

AnyDigi HP（anydigi.co.jp）の前日分アクセスデータをGA4 BigQueryエクスポートから分析し、Neonに蓄積してレポートを生成します。

## Step 1: 前日の日付を特定

Bash で JST の前日日付を取得する:

```bash
TZ=Asia/Tokyo date -v-1d '+%Y-%m-%d %Y%m%d %A'
```

- `YYYY-MM-DD` 形式（Neon保存用）
- `YYYYMMDD` 形式（BQテーブル参照用）
- 曜日（レポート用）

## Step 2: テーブル存在確認

`mcp__bq__query` で `analytics_530709614` データセットのテーブル一覧を確認:

```sql
SELECT table_id FROM `analytics_530709614.__TABLES__`
WHERE table_id IN ('events_YYYYMMDD', 'events_intraday_YYYYMMDD')
```

- `events_YYYYMMDD`（確定版）があればそちらを優先
- `events_intraday_YYYYMMDD`（日中版）のみの場合はそちらを使用
- どちらも存在しない場合は「前日分のテーブルが見つかりません」と報告して終了

**ワイルドカード（`events_*`）は使用禁止（クエリ量爆発防止）。**

## Step 3: 4項目のクエリを実行

前日テーブルに対して以下を実行する。可能な限り並列で。

### 3-1: サマリー（UU + PV）
```sql
SELECT
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNTIF(event_name = 'page_view') AS pageviews
FROM `analytics_530709614.{テーブル名}`
```

### 3-2: ページ別PV
```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_url,
  COUNT(*) AS pageviews
FROM `analytics_530709614.{テーブル名}`
WHERE event_name = 'page_view'
GROUP BY page_title, page_url
ORDER BY pageviews DESC
```

### 3-3: 流入元
```sql
SELECT
  traffic_source.source,
  traffic_source.medium,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNT(*) AS pageviews
FROM `analytics_530709614.{テーブル名}`
WHERE event_name = 'page_view'
GROUP BY traffic_source.source, traffic_source.medium
ORDER BY unique_users DESC
```

### 3-4: デバイス種別
```sql
SELECT
  device.category AS device_type,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNT(*) AS pageviews
FROM `analytics_530709614.{テーブル名}`
WHERE event_name = 'page_view'
GROUP BY device.category
ORDER BY unique_users DESC
```

### 3-5: 地域別（都道府県）
```sql
SELECT
  geo.region AS region,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNT(*) AS pageviews
FROM `analytics_530709614.{テーブル名}`
WHERE event_name = 'page_view'
  AND geo.region IS NOT NULL
  AND geo.region != ''
GROUP BY geo.region
ORDER BY pageviews DESC
```

## Step 4: Neon に書き込み

取得したデータを Neon の insights スキーマに書き込む。
既に同日のデータがある場合はスキップ（`onConflictDoNothing` / 重複チェック）。

スクリプト実行例:

```bash
npx tsx -e '
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hpDailySummary, hpPages, hpTraffic, hpDevices, hpRegions } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
  // 1. hp_daily_summary
  await db.insert(hpDailySummary).values({
    date: "YYYY-MM-DD",
    uniqueUsers: X,
    pageviews: X,
    dataSource: "テーブル名",
  }).onConflictDoNothing();

  // 2. hp_pages（同日データを先に削除してから挿入）
  // await db.delete(hpPages).where(eq(hpPages.date, "YYYY-MM-DD"));
  // await db.insert(hpPages).values([...]);

  // 3. hp_traffic
  // 4. hp_devices
  // 5. hp_regions（同日データを先に削除してから挿入）
  // await db.delete(hpRegions).where(eq(hpRegions.date, "YYYY-MM-DD"));
  // await db.insert(hpRegions).values([...]);
}
main();
'
```

**注意:**
- `hp_daily_summary` は date に UNIQUE 制約があるので `onConflictDoNothing` で重複防止
- `hp_pages`, `hp_traffic`, `hp_devices`, `hp_regions` は date に UNIQUE 制約がないため、同日データが既にある場合は先に削除してから挿入する
- 実際の値は Step 3 のクエリ結果を使うこと

## Step 5: 完了表示

```
## HP分析完了（YYYY-MM-DD）

- UU: X / PV: X
- Neon書き込み: 完了
```
