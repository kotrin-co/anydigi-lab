---
name: needradar-reddit
description: Reddit投稿（R2/Cube経由）からニーズを抽出してneedradar.needsに蓄積する
---

NeedRadar のニーズ収集（Reddit版）を実行します。

## Step 1: Cube から投稿取得

`mcp__cube__query` で本日（または昨日フォールバック）の Reddit 投稿を取得する。R2 上の parquet を DuckDB 経由で読む。Cube モデル `reddit_posts` はすでに `post_id` で dedup 済み（最新 dt の行のみ採用）。

```json
{
  "dimensions": [
    "reddit_posts.post_id",
    "reddit_posts.subreddit",
    "reddit_posts.category",
    "reddit_posts.language",
    "reddit_posts.title",
    "reddit_posts.selftext",
    "reddit_posts.permalink"
  ],
  "measures": [
    "reddit_posts.total_score",
    "reddit_posts.avg_upvote_ratio",
    "reddit_posts.total_comments"
  ],
  "filters": [
    { "member": "reddit_posts.stickied", "operator": "equals", "values": ["false"] },
    { "member": "reddit_posts.over_18", "operator": "equals", "values": ["false"] }
  ],
  "timeDimensions": [
    { "dimension": "reddit_posts.snapshot_date", "dateRange": ["YYYY-MM-DD", "YYYY-MM-DD"] }
  ],
  "order": [["reddit_posts.total_score", "desc"]],
  "limit": 1000
}
```

**注意:**
- `dateRange` には JST 本日日付を絶対形式で2回（`"today"` 等の相対キーワードは使わない）
- R2 lifecycle により `reddit/posts/` は 2 日保持（古いものは自動削除されるので、データ量は自然に絞られる）
- 0 件の場合は `dateRange` を昨日〜本日に広げて再試行する
- それでも 0 件なら「本日の対象投稿はありません」と表示して終了
- `score`, `upvote_ratio`, `num_comments` は `total_*` measure として取得する（dedup 済みなので 1 行 1 投稿、合計 = その投稿の値）
- `LENGTH(title) BETWEEN 15 AND 300` は Claude 側で取得後にフィルタする
- カテゴリ6種（startup / ai / business / food / tech / japan）を全件分析する

## Step 2: ニーズ抽出

取得した投稿（title + selftext）を読み、**ビジネスとして解決できる困りごと・不満・欲しいもの**を抽出する。

**判断基準（採用）:**
- 「How do I...」「Anyone else struggling with...」「I wish there was...」「Need help with...」など具体的な困りごと
- 同じ subreddit 内で類似の不満が複数投稿に出ている
- score / upvote_ratio が高い（コミュニティの共感が強い）
- num_comments が多い（議論を呼んでいる ＝ 関心が高い）

**判断基準（除外）:**
- 自己宣伝・サクセスストーリー・収益報告（"I made $XX")
- ミーム・ジョーク・雑談
- 政治・宗教的意見
- 既存SaaSの単純なレコメンド質問（"What's the best CRM?"）
- AI/MLの研究論文紹介・モデルリリース報告（実装相談を除く）

**vertical の分類:**
- `food`: 食品・飲食・農業に関するニーズ（r/FoodBusiness, r/restauranteur 中心）
- `manufacturing`: 製造・工場・現場に関するニーズ
- `creative`: 制作・デザイン・コンテンツに関するニーズ
- `general`: その他

**region 推定:**
- `subreddit` が `Japan` / `JapanLife` または `language = 'ja'` → `JP`
- それ以外の英語圏 subreddit → `US`（欧州圏は現状 US に丸める）

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
- **証拠投稿:** [score, upvotes率] "[title 抜粋]" (r/subreddit, region: JP/US)

## 既存ニーズへの証拠追加

### [既存ニーズタイトル]（id: X, 現在 evidence_count: Y）
- **証拠投稿:** [score, upvotes率] "[title 抜粋]" (r/subreddit, region: JP/US)

## スキップ
- [スキップ理由を一言]
```

## Step 5: Neon に書き込む

Step 2-3 の結果を元に TypeScript スクリプトを生成して実行する。

スクリプトの構造:
1. `generateEmbedding(title + "\n" + summary)` で各新規ニーズの embedding 生成
2. `findSimilarNeeds(db, embedding, 0.80)` で既存ニーズと照合
   - 類似あり → evidence_count++, sources 更新（重複追加しない、permalink を含める）, regions 更新（重複追加しない）
   - 類似なし → INSERT（embedding, regions も一緒に保存）
3. 既存ニーズへの証拠追加は evidence_count++, sources 更新, regions 更新のみ

スクリプトのファイル名: `scripts/needradar-collect-reddit-YYYY-MM-DD.ts`

使用するインポート:
```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";
```

`sources` には `https://reddit.com{permalink}` を保存する（subreddit + post_id でも辿れるが、permalink が最も再現性が高い）。

## Step 6: サマリー表示

```
## needradar-reddit 実行完了（YYYY-MM-DD）

- 取得投稿数: X件
- 分析対象投稿数: X件（score>=10）
- 新規ニーズ: X件
- 証拠追加（既存）: X件
- スキップ: X件
- アクティブニーズ総数: X件
```

## Step 7: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で `scripts/` 配下に生成したスクリプトを `scripts/archives/YYYY-MM/`（YYYY-MM は実行日の年月）へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/<本実行で生成したファイル名> scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない（再実行で内容を確認・修正できるよう残す）
- 複数ファイルを生成した場合は全て移動する
- ディレクトリが既にあれば `mkdir -p` は no-op
