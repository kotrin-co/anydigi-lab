---
name: needradar-youtube
description: YouTubeコメント（R2/Cube経由）からニーズを抽出してneedradar.needsに蓄積する
---

NeedRadar のニーズ収集を実行します。

## Step 1: Cube からコメント取得

`mcp__cube__query` で昨日の YouTube コメント（人気動画に紐づくもの）を取得する。R2 上の parquet を DuckDB 経由で読む。`video_comments` cube は `popular_videos` cube と `video_id` で join 済み。

```json
{
  "dimensions": [
    "video_comments.comment_id",
    "video_comments.video_id",
    "video_comments.text",
    "video_comments.like_count",
    "popular_videos.region_code",
    "popular_videos.category"
  ],
  "filters": [
    { "member": "popular_videos.region_code", "operator": "equals", "values": ["JP", "US", "KR"] },
    { "member": "popular_videos.category", "operator": "equals",
      "values": ["ハウツーとスタイル", "科学と技術", "自動車と乗り物", "ペットと動物", "ブログ"] },
    { "member": "video_comments.text_length", "operator": "gte", "values": ["15"] },
    { "member": "video_comments.text_length", "operator": "lte", "values": ["500"] }
  ],
  "timeDimensions": [
    { "dimension": "video_comments.snapshot_date", "dateRange": ["YYYY-MM-DD", "YYYY-MM-DD"] },
    { "dimension": "popular_videos.snapshot_date", "dateRange": ["YYYY-MM-DD", "YYYY-MM-DD"] }
  ],
  "order": [["video_comments.like_count", "desc"]],
  "limit": 5000
}
```

**注意:**
- `dateRange` には JST 昨日日付を絶対形式で2回（`"yesterday"` 等の相対キーワードは使わない）
- `popular_videos` への join により region_code / category でフィルタできる
- カテゴリ5種 × 国3種 を一括取得、`like_count` 降順で 5000 件まで（per-group top-N は厳密ではないが、グローバル上位 5000 件で十分）
- region_code / category ごとの偏りは Claude 側で確認し、必要なら抽出時に各グループから明示的にサンプリングする
- 結果は Read ツールで読み込んで分析する
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

## Step 7: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で `scripts/` 配下に生成したスクリプト（`scripts/needradar-collect-YYYY-MM-DD.ts`）を `scripts/archives/YYYY-MM/`（YYYY-MM は実行日の年月）へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/needradar-collect-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない（再実行で内容を確認・修正できるよう残す）
- 複数ファイルを生成した場合は全て移動する
- ディレクトリが既にあれば `mkdir -p` は no-op
