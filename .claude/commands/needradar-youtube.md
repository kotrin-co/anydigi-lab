---
name: needradar-youtube
description: YouTube コメント（R2 を直 DuckDB で読む）からニーズを抽出して needradar.needs に蓄積する
---

NeedRadar のニーズ収集（YouTube 版）を実行します。

## Step 0: 前提

R2 上の parquet を読むのは `scripts/lib/duckdb-r2.ts` の `queryR2(sql)` を使う（`duckdb` npm の直叩き、Cube 経由しない）。R2 認証は `.env` の `R2_*` から自動で読まれる。

Cube は廃止済み。`apps/cube/` は履歴のために残してあるが、起動する必要はない。

## Step 1: 最新 dt を確認

R2 上の `youtube/comments/dt=*/` と `youtube/popular_videos/dt=*/` の最新パーティション（UTC ベース）を先に確認する。

その場で短い probe スクリプト（例: `scripts/_yt-probe.ts`）を生成して実行する。

```typescript
import { queryR2 } from "./lib/duckdb-r2";

async function main() {
  const dts = await queryR2<{ dt: string; n: bigint }>(`
    SELECT regexp_extract(filename, 'dt=([0-9-]+)/', 1) AS dt, COUNT(*)::BIGINT AS n
    FROM read_parquet('s3://anydigi-lab/youtube/comments/dt=*/*.parquet',
      filename = true)
    GROUP BY 1 ORDER BY 1 DESC LIMIT 3
  `);
  console.log("comments dts:", dts);

  const dts2 = await queryR2<{ dt: string; n: bigint }>(`
    SELECT regexp_extract(filename, 'dt=([0-9-]+)/', 1) AS dt, COUNT(*)::BIGINT AS n
    FROM read_parquet('s3://anydigi-lab/youtube/popular_videos/dt=*/*.parquet',
      filename = true)
    GROUP BY 1 ORDER BY 1 DESC LIMIT 3
  `);
  console.log("popular_videos dts:", dts2);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

通常は両者の最新 dt は同じ。違う場合は **両方に存在する最新の dt** を採用する。

**重要：日付の決め方**

- 収集パイプライン（GCP Cloud Functions）は UTC 基準で `dt=YYYY-MM-DD` のパーティションを書く
- 日本時間の朝（JST 07-09 時 = UTC の前日 22-24 時）に本コマンドを動かすと、UTC では「前日」がまだ続いているため、**最新 dt は通常「JST 昨日 = UTC 同日 or 前日」**になる
- ハードコードで「JST 昨日」を渡すと、最新 dt が UTC で 1 日ずれて 0 件になることがある（過去に再発）

## Step 2: コメント取得

最新 dt を Step 1 で確認したら、コメントを取得する probe スクリプト（例: `scripts/_yt-fetch.ts`）を生成して実行。

```typescript
import { queryR2 } from "./lib/duckdb-r2";

const DT = "YYYY-MM-DD";  // Step 1 で確認した最新 dt

async function main() {
  const rows = await queryR2<{
    text: string;
    like_count: bigint;
    region_code: string;
    category: string;
    title: string;
    video_id: string;
  }>(`
    WITH vc AS (
      SELECT video_id, text, like_count
      FROM read_parquet('s3://anydigi-lab/youtube/comments/dt=${DT}/*.parquet')
      WHERE LENGTH(text) BETWEEN 15 AND 500
    ),
    pv AS (
      SELECT video_id, region_code,
        basic_info.category AS category,
        basic_info.title AS title
      FROM read_parquet('s3://anydigi-lab/youtube/popular_videos/dt=${DT}/*.parquet')
      WHERE region_code IN ('JP', 'US', 'KR')
        AND basic_info.category IN ('ハウツーとスタイル', '科学と技術', '自動車と乗り物', 'ペットと動物', 'ブログ')
    )
    SELECT vc.text, vc.like_count, pv.region_code, pv.category, pv.title, vc.video_id
    FROM vc JOIN pv ON vc.video_id = pv.video_id
    ORDER BY vc.like_count DESC
    LIMIT 200
  `);
  console.log("count:", rows.length);
  for (const r of rows) {
    const text = (r.text ?? "").replace(/\s+/g, " ").slice(0, 220);
    console.log(`---\n[${r.region_code}/${r.category} ♥${r.like_count}] ${r.title?.slice(0, 60)}\n${text}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

**注意:**

- `popular_videos` の parquet スキーマは `basic_info: STRUCT` / `statistics: STRUCT` がネスト構造になっている。`basic_info.category` のようにドット記法でアクセス
- `category` フィールドはトレンドフィードのタイトル（"最新" など）ではなく、ジャンルカテゴリを指す（"ハウツーとスタイル"／"科学と技術" 等。日本語表記でも US/KR ともに同じ表記）
- 同じ video_id が複数 region/category で popular に出てくるため、JOIN 後の行はテキスト重複しやすい。Step 3 で 1 件 1 件読むときに同一テキストは 1 度評価すれば十分
- probe スクリプトは Step 5 のアーカイブ対象外。削除してよい

## Step 3: コメントを読み、ニーズを抽出

Claude（あなた）が Step 2 の出力（`tmp/youtube-YYYY-MM-DD.txt` でもよい）を読み、以下の判断基準で抽出する。**この時点ではまだ DB を触らない**。

**採用基準:**
- 「How do I...」「Anyone else struggling with...」「I wish there was...」「困ってる」「どうすれば」など具体的な困りごと
- 同じ video／category 内で類似の不満が複数コメントに出ている
- like_count が高い（コミュニティの共感・関心が強い）

**除外基準:**
- リアクション・ジョーク・ジャンルファン同士の挨拶
- 動画への賞賛・批判のみ（具体的問題提起なし）
- 政治・宗教的意見
- スパム的なオファー・宣伝

**vertical の分類:**
- `food`: 食品・飲食・農業
- `manufacturing`: 製造・工場・現場
- `creative`: 制作・デザイン・コンテンツ
- `general`: その他

**region 推定:**
- `region_code = 'JP'` → `JP`
- それ以外 → `US`（KR は現状 US に丸める）

YouTube トップコメントは一般にリアクション主体で need 信号が薄いことが多い。**抽出ゼロでも問題ない**。無理に need 化しないこと。

## Step 4: 既存ニーズの確認

```sql
SELECT id, title, vertical, evidence_count, sources, regions
FROM needradar.needs
WHERE status = 'active'
ORDER BY evidence_count DESC
LIMIT 50
```

## Step 5: 書き込みスクリプト生成 & 実行

ファイル名: `scripts/needradar-youtube-YYYY-MM-DD.ts`

embedding 類似度 0.80 で dedup する（`@anydigi-lab/database/embedding` の `findSimilarNeeds`）。

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const sql = client;
const db = drizzle(client);

type NewNeed = {
  title: string;
  summary: string;
  vertical: "food" | "manufacturing" | "creative" | "general";
  region: "JP" | "US" | "EU";
  source: string;
};

type EvidenceAdd = {
  needId: number;
  region: "JP" | "US" | "EU";
  source: string;
  note: string;
};

const NEW_NEEDS: NewNeed[] = [ /* Step 3 で抽出したもの。ゼロでも可 */ ];
const EVIDENCE: EvidenceAdd[] = [ /* 既存 need に紐付ける証拠。ゼロでも可 */ ];

// upsertNew / addEvidence は他コマンドと同じ実装
```

実行: `npx tsx scripts/needradar-youtube-YYYY-MM-DD.ts`

## Step 6: サマリー表示

```
## /needradar-youtube 完了（dt=YYYY-MM-DD）

- 対象 dt: YYYY-MM-DD
- 取得コメント: X 件（200 上限）
- 新規ニーズ: X 件
- 既存ニーズへ統合（embedding sim >= 0.80）: X 件
- 既存ニーズへ証拠追加: X 件
- アクティブニーズ総数: X 件
```

## Step 7: 成功時のアーカイブ

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/needradar-youtube-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断時は移動しない
- probe スクリプト（`_yt-probe.ts` / `_yt-fetch.ts`）はアーカイブ対象外。削除してよい

## 注意

- YouTube トップコメントは need 信号が薄い（リアクション中心）。抽出ゼロを許容する設計にしている
- Reddit と違い、YouTube は YouTube Data API v3（API key）経由で Cloud Functions が R2 に書き込む構造なので、本コマンドは「R2 から読む」のみ。fetch は走らせない
- `category` をハウツー・科学技術・自動車・ペット・ブログに絞っているのは、エンタメ・音楽カテゴリだとリアクション率がさらに高くなるため
