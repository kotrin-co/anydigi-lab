---
name: needradar-youtube
description: YouTubeコメントからニーズを抽出してneedradar.needsに蓄積する
---

NeedRadar のニーズ収集を実行します。

## Step 1: BQ からコメント取得

`mcp__bq__query` で昨日の YouTube コメントを取得する。

```sql
WITH target_videos AS (
  SELECT DISTINCT video_id, basic_info.category AS category, region_code
  FROM `sns_metrics.popular_videos`
  WHERE snapshot_date = DATE_SUB(CURRENT_DATE('Asia/Tokyo'), INTERVAL 1 DAY)
    AND region_code IN ('JP', 'US', 'KR')
    AND basic_info.category IN ('ハウツーとスタイル', '科学と技術', '自動車と乗り物', 'ペットと動物', 'ブログ')
),
dedup AS (
  SELECT
    c.comment_id,
    v.category,
    v.region_code,
    c.text,
    c.like_count,
    ROW_NUMBER() OVER (PARTITION BY c.comment_id ORDER BY c.like_count DESC) AS rn
  FROM `sns_metrics.video_comments` c
  JOIN target_videos v ON c.video_id = v.video_id
  WHERE c.snapshot_date = DATE_SUB(CURRENT_DATE('Asia/Tokyo'), INTERVAL 1 DAY)
    AND LENGTH(c.text) BETWEEN 15 AND 500
),
ranked AS (
  SELECT
    comment_id, category, region_code, like_count, text,
    ROW_NUMBER() OVER (
      PARTITION BY category, region_code
      ORDER BY like_count DESC
    ) AS rank_in_group
  FROM dedup
  WHERE rn = 1
)
SELECT comment_id, category, region_code, like_count, text
FROM ranked
WHERE rank_in_group <= 1000
ORDER BY region_code, category, like_count DESC
```

**注意:**
- パーティション絞り込み（snapshot_date）必須
- カテゴリ5種 × 国3種 × 上位1000件 = 最大15,000件
- 結果はファイル保存されるので Read ツールで読み込んで分析する
- コメントが0件の場合は「本日の対象コメントはありません」と表示して終了

## Step 2: ニーズ抽出

取得したコメントを読み、**ビジネスとして解決できる困りごと・不満・欲しいもの**を抽出する。

**判断基準（採用）:**
- 「〜が不便」「〜が欲しい」「〜が面倒」「〜できない」など具体的な困りごと
- 同じ動画の複数コメントで同じ不満が出ている
- like_count が高い（多くの人が共感している）

**判断基準（除外）:**
- 応援・感想・賞賛コメント
- 特定の人・キャラクターへの言及
- 政治・宗教的意見
- ゲームの攻略・UI要望（任天堂等への要望で中川が解けないもの）

**vertical の分類:**
- `food`: 食品・飲食・農業に関するニーズ
- `manufacturing`: 製造・工場・現場に関するニーズ
- `creative`: 制作・デザイン・コンテンツに関するニーズ
- `general`: その他

## Step 3: 既存ニーズの確認

`mcp__neon__query` で現在の `needradar.needs` を全件取得して把握する。

```sql
SELECT id, title, vertical, evidence_count, sources, created_at
FROM needradar.needs
WHERE status = 'active'
ORDER BY evidence_count DESC
```

## Step 4: 結果を表示

抽出したニーズを以下の形式で表示する:

```
## 新規ニーズ

### [ニーズタイトル]
- **要約:** [1-2文]
- **vertical:** food / manufacturing / creative / general
- **証拠コメント:** [like数] "[コメント抜粋]" (region: JP/US/KR)

## 既存ニーズへの証拠追加

### [既存ニーズタイトル]（id: X, 現在 evidence_count: Y）
- **証拠コメント:** [like数] "[コメント抜粋]" (region: JP/US/KR)

## スキップ
- [スキップ理由を一言]
```

## Step 5: Neon に書き込む

Step 2-3 の結果を元に TypeScript スクリプトを生成して実行する。

スクリプトの構造:
1. `generateEmbedding(title + "\n" + summary)` で各新規ニーズの embedding 生成
2. `findSimilarNeeds(db, embedding, 0.80)` で既存ニーズと照合
   - 類似あり → evidence_count++, sources 更新（重複追加しない）, regions 更新（重複追加しない）
   - 類似なし → INSERT（embedding, regions も一緒に保存）
3. 既存ニーズへの証拠追加は evidence_count++, sources 更新, regions 更新のみ

スクリプトのファイル名: `scripts/needradar-collect-YYYY-MM-DD.ts`

使用するインポート:
```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";
```

## Step 6: サマリー表示

```
## needradar-collect 実行完了（YYYY-MM-DD）

- 取得コメント数: X件
- 分析コメント数: X件（like>=3）
- 新規ニーズ: X件
- 証拠追加（既存）: X件
- スキップ: X件
- アクティブニーズ総数: X件
```
