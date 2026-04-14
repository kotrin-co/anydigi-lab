---
name: insights
description: BQからRSS記事を取得し、ビジネスアイデアを抽出・スコアリングしてNeonに蓄積する
---

insights モジュールの日次分析を実行します。

## Step 1: BQ から記事を取得

`mcp__bq__query` で今日のRSS記事を取得する。

```sql
SELECT DISTINCT id, url, title, content, source_name, source_category, published_at
FROM sns_metrics.rss_articles
WHERE DATE(published_at, 'Asia/Tokyo') = CURRENT_DATE('Asia/Tokyo')
  AND source_category IN ('ai', 'dx')
ORDER BY published_at DESC
LIMIT 30
```

**注意:**
- `published_at` によるパーティション絞り込みは必須（コスト防止）
- `content` はアイデア抽出に使うが Neon には保存しない
- 記事が0件の場合は「本日の新着記事はありません」と表示して終了

## Step 2: 記事を Neon に同期

取得した記事の参照情報（content 以外）を `insights.articles` に upsert する。
既に存在する id はスキップする。

## Step 3: アイデア抽出

取得した記事の title と content を読み、**2つの視点**でアイデアを抽出する。

### 3-1: 既存アイデアの確認

Neon の `insights.ideas` から `status = 'active'` のアイデアを全件取得し、現在のアイデア一覧を把握する。

### 3-2: 各記事の分析（2系統）

記事ごとに以下を判断する:

#### 系統A: AnyDigi 事業アイデア（category = "anydigi"）

AnyDigiの事業領域に直結するアイデアを抽出する。

**判断基準:**
- データ × AI基盤エンジニアリング / AI参謀と接続できるか
- 代表のバックグラウンド（元電力会社、フルスタック、中小企業向け）が活きるか
- 1人 + AI で実現可能なスケールか
- 「AIすごい」で終わらない、具体的なサービスにつながるか

#### 系統B: 一般事業アイデア（category = "general"）

AnyDigiの領域に限らず、事業アイデアとして有望なものを抽出する。

**判断基準:**
- 市場規模・成長性があるか
- タイミングが良いか（早すぎず遅すぎず）
- 具体的なビジネスモデルが見えるか
- 既存プレイヤーの隙間があるか

#### 共通ルール

**新規アイデアの場合:**
- embedding による重複チェックを行う:
  1. `generateEmbedding(title + "\n" + summary)` でベクトル生成
  2. `findSimilarIdeas(db, embedding, 0.80)` で既存アイデアと照合
  3. 類似度 80% 以上のアイデアが存在 → 新規ではなく既存アイデアへの evidence として扱う
  4. 類似度 80% 未満 → 新規アイデアとして insert（embedding も一緒に保存）
- ユーティリティは `src/lib/embedding.ts` の `generateEmbedding` / `findSimilarIdeas` を使用
- category に "anydigi" または "general" を付与する

**既存アイデアの証拠（evidence）になる場合:**
- 既存アイデアの市場性・タイミング・実現性を裏付ける内容か
- 関連性がある場合は relevance_note に理由を記述する

**どちらにも該当しない場合:**
- スキップする。無理にアイデアを絞り出さない
- ニュース記事1本だけでは弱い場合は evidence として蓄積し、裏付けが増えてからアイデア化する

### 出力形式（画面表示用）

```
## 新規アイデア（AnyDigi）

### [アイデアタイトル]
- **概要:** [1-2文のサマリー]
- **元記事:** [記事タイトル]（ソース名）
- **スコア:** market=X, fit=X, timing=X, evidence=X

## 新規アイデア（General）

### [アイデアタイトル]
- **概要:** [1-2文のサマリー]
- **元記事:** [記事タイトル]（ソース名）
- **スコア:** market=X, fit=X, timing=X, evidence=X

## 既存アイデアへの証拠追加

### [既存アイデアタイトル]（id: X, category: anydigi/general）
- **元記事:** [記事タイトル]（ソース名）
- **関連性:** [relevance_note]

## スキップした記事
- [タイトル] — [スキップ理由を一言]
```

## Step 4: Neon に書き込み

Step 3 の結果を Neon に書き込む。

### 新規アイデアの場合
1. `insights.ideas` に insert（title, summary, category, embedding, status='active'）
2. `insights.idea_evidence` に insert（idea_id, article_id, relevance_note）
3. `insights.idea_scores` に insert（idea_id, market, fit, timing, evidence）

### 既存アイデアの証拠追加の場合
1. `insights.idea_evidence` に insert（idea_id, article_id, relevance_note）

### スコアリング
新規アイデアには以下の4軸で 1-10 のスコアを付与する:

| 軸 | 観点 |
|---|---|
| market | 市場規模・成長性。ターゲット顧客がどれだけいるか |
| fit | AnyDigiの強み（データ×AI基盤）との適合度 |
| timing | 今やるべきか。市場の成熟度、競合状況 |
| evidence | 裏付けの強さ。記事数、具体性、実例の有無 |

## Step 5: rerank（デフォルト実行）

全アクティブアイデアの再スコアリングを実行する。`--no-rerank` が指定された場合のみスキップする。

1. `insights.ideas` から `status = 'active'` を全件取得
2. 各アイデアの `idea_evidence` 件数と最新の記事日付を確認
3. 今日取得した記事の全体的なトレンドも踏まえて4軸スコアを再評価
4. `insights.idea_scores` に新しい行を insert（履歴として蓄積）

**注意:**
- 新規アイデアも含めて全件を再評価する（Step 4で付与した初期スコアも上書きされうる）
- 既存アイデアにevidenceが追加された場合、evidenceスコアの引き上げを検討する
- rerankはスコア履歴として蓄積されるため、時系列でのスコア変動を追跡できる

## Step 6: サマリー表示

実行結果のサマリーを表示する:

```
## insights 実行完了（YYYY-MM-DD）

- 取得記事数: X件
- 新規アイデア: X件
- 証拠追加: X件（既存アイデアY件に対して）
- スキップ: X件
- rerank: X件のアイデアを再スコアリング
- アクティブアイデア総数: X件
```

## Step 7: HP アクセス分析

`.claude/commands/hp.md` の手順に従い、前日分のHPアクセスデータを分析・Neon蓄積・Slack投稿する。

## Step 8: X投稿の生成

`.claude/commands/x-post.md` の手順に従い、X投稿を生成する。

このステップは insights の続きとして実行されるため、Step 1〜6 で取得・生成した記事データ・アイデア・スコアをそのまま引き継ぐ。x-post 側の Step 1-1, 1-2 はスキップされる。
