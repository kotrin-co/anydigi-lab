---
name: lab-demo
description: /demo ページの今日分の質問セットと32パターンレポートをNeonに生成・蓄積する
---

`lab.anydigi.co.jp/demo` のチャットボットが返す「本日のトピック × 立場 × 深さ」のレポートを事前生成して `demo.question_sets` / `demo.reports` に蓄積します。

## 構造のおさらい

- 1 日 1 行: `demo.question_sets` に Q1 トピック 4 件と intro を JSON で保存
- 1 日 32 行: `demo.reports` に `topic × role × depth = 4 × 4 × 2` のパターンを保存
- ユニーク制約: `(question_set_id, topic_index, role, depth)`
- フロントは ISR (revalidate=3600) で `question_sets` を読み、ユーザー選択時に Server Action で `reports` を 1 行取りつつ `view_count` を +1

## Step 1: 既存の question_set を確認

`mcp__neon__query` で本日分が既に生成済みかをチェック。

```sql
SELECT id, generated_for_date, jsonb_array_length(topics) AS topic_count
FROM demo.question_sets
WHERE generated_for_date = CURRENT_DATE
```

- 既に存在し、かつ `demo.reports` に紐付くレポートが 32 件揃っている場合 → 「本日分は生成済みです」と表示して終了
- レコードはあるが reports が不完全な場合 → 不足分のみ生成（再開）
- 何も無ければ → Step 2 から開始

## Step 2: 本日の RSS 記事を取得

`mcp__cube__query` で `rss_articles` を取得（DuckDB 経由 R2 parquet 読み）。

```json
{
  "dimensions": [
    "rss_articles.id",
    "rss_articles.title",
    "rss_articles.content",
    "rss_articles.source_name",
    "rss_articles.source_category",
    "rss_articles.url",
    "rss_articles.published_at"
  ],
  "filters": [
    { "member": "rss_articles.source_category", "operator": "equals", "values": ["ai", "dx"] }
  ],
  "timeDimensions": [
    { "dimension": "rss_articles.published_at", "dateRange": ["YYYY-MM-DD", "YYYY-MM-DD"] }
  ],
  "order": [["rss_articles.published_at", "desc"]],
  "limit": 100
}
```

注意:
- `dateRange` は JST 本日日付の絶対形式
- 0 件のときは前日にフォールバック
- それでも 0 件なら「本日の対象記事はありません」と表示して終了

## Step 3: Q1 トピック 4 件と intro を生成

取得した記事の title + content を読み、**潜在顧客（事業会社の経営層・マネージャー・企画・1人会社）が今日関心を持ちそうなテーマを 4 件**抽出する。

判断基準:
- 4 件は重複しない別軸のテーマ（AI 規制／生成 AI 活用／データ基盤／スタートアップ動向 など）
- 抽象すぎず具体すぎず、12〜20 文字程度のラベル
- description は 20〜30 文字で「何が語れるか」を補足

`intro` は当日の話題を踏まえた 1 文（例: 「今日は AI 規制と生成 AI の現場活用の話題が目立ちました」）。

各トピックに **使う記事の id 配列** も決めておく（後段のレポート生成で参照する根拠になる）。

## Step 4: question_set を Neon に保存

`demo.question_sets` に upsert（`generated_for_date` UNIQUE）。

```sql
INSERT INTO demo.question_sets (generated_for_date, topics, intro, status)
VALUES (CURRENT_DATE, $1::jsonb, $2, 'active')
ON CONFLICT (generated_for_date) DO UPDATE
  SET topics = EXCLUDED.topics, intro = EXCLUDED.intro
RETURNING id
```

`topics` の JSON 構造:
```json
[
  {
    "label": "AI 規制と企業対応",
    "description": "ガバナンス・各国動向・実務対応",
    "articleIds": ["abc123", "def456"]
  },
  ...
]
```

返却された `question_set_id` を Step 5 以降で使う。

## Step 5: 32 パターンのレポートを生成

トピック 4 × 立場 4 × 深さ 2 = 32 レポート。**1 トピックあたり 1 プロンプトで 8 パターン (4 role × 2 depth) をまとめて JSON で返させる**ことで LLM 呼び出しを 4 回に抑える。

### Role 定義

| value | label | 視点 |
|---|---|---|
| executive | 経営者・役員 | 全社戦略・投資判断・リスク |
| manager | 現場マネージャー | チーム運用・実装・KPI |
| planner | 企画・新規事業 | アイデア・市場機会・事業設計 |
| solo | 個人事業主・1人会社 | 1人で回す視点・小さく始める |

### Depth 定義

| value | label | 出力量目安 | フレーム |
|---|---|---|---|
| digest | ざっくり要約 | 200〜300 字 | 【3行サマリー】+【あなたへの一手】 |
| detailed | じっくり分析 | 600〜900 字 | 【3行サマリー】+【背景と動き】+【あなたへの示唆】+【今日できる一手】 |

### Content フレーム（detailed）

レポートの `content` は以下の 4 セクションをこの順で含めること。各セクション見出しは `【】` で全角括弧の装飾見出しを使い、本文と明確に分ける（フロントは `whitespace-pre-wrap` でそのまま表示する）。

```
【3行サマリー】
今日のニュースの要点を 3 行で（誰が・何を・なぜ重要か）。
固有名詞と数字を最初の 3 行に入れる。

【背景と動き】
詳細な状況解説。記事の固有名詞・数字を活かしつつ、
立場（executive/manager/planner/solo）の関心軸で深掘りする。
中立解説ではなく、その立場が読みたい角度で書く。

【あなたへの示唆】
立場ごとに「自分にどう効くか」を 2〜3 点。
箇条書きでも段落でもよいが、各点に why（なぜそうなるか）を含める。

【今日できる一手】
明日の朝までに着手できる具体アクション 1〜2 個。
「契約を見直す」のような抽象ではなく
「ベンダー独立性マップを 1 ページ作る」程度の粒度で。
```

### Content フレーム（digest）

```
【3行サマリー】
3 行で結論をまとめる。

【あなたへの一手】
今日できる 1〜2 文の打ち手。
```

### プロンプト雛形（1 トピック分）

```
以下の RSS 記事 N 件をベースに、トピック「{topic.label}」について
4 つの立場 × 2 つの深さ = 8 つのレポートを生成してください。

# 立場
- executive: 経営者・役員視点（戦略・投資判断・全社リスク）
- manager: 現場マネージャー視点（チーム運用・実装・KPI）
- planner: 企画・新規事業視点（市場機会・事業設計）
- solo: 個人事業主・1 人会社視点（小さく始める実践)

# 深さとフレーム
- digest: 200〜300 字、以下の構成
    【3行サマリー】<3行>
    【あなたへの一手】<1〜2文>
- detailed: 600〜900 字、以下の構成
    【3行サマリー】<3行>
    【背景と動き】<段落>
    【あなたへの示唆】<2〜3点>
    【今日できる一手】<1〜2個、具体的アクション>

# 共通ルール
- title は 16〜28 字程度、立場が一目で分かるように
- 記事の固有名詞・数字は最初の 3 行サマリーに必ず入れる
- 推測の事実は断定しない（「〜と報じられています」「〜と考えられます」）
- 専門用語は最小限、潜在顧客（非エンジニア）が読める日本語
- 「今日できる一手」は抽象的提案を避け、明日の朝までに着手できる粒度で書く
- セクション見出し【】は全角括弧、本文と空行で区切る

# 入力記事
{記事1: title + content（要約）}
{記事2: title + content（要約）}
...

# 出力 (JSON only)
{
  "reports": [
    { "role": "executive", "depth": "digest",   "title": "...", "content": "【3行サマリー】..." },
    { "role": "executive", "depth": "detailed", "title": "...", "content": "【3行サマリー】..." },
    { "role": "manager",   "depth": "digest",   "title": "...", "content": "..." },
    ...8件
  ]
}
```

このプロンプトをトピック 4 つそれぞれに対して走らせ、合計 32 レポートを得る。

## Step 6: reports を Neon に保存

`demo.reports` に bulk insert。冪等性のため `ON CONFLICT DO UPDATE` で content を上書き可能にする。

```sql
INSERT INTO demo.reports (
  question_set_id, topic_index, role, depth, title, content, source_article_ids
) VALUES ($1, $2, $3, $4, $5, $6, $7::text[])
ON CONFLICT (question_set_id, topic_index, role, depth) DO UPDATE
  SET title = EXCLUDED.title,
      content = EXCLUDED.content,
      source_article_ids = EXCLUDED.source_article_ids
```

`source_article_ids` は当該 topic の `articleIds` をそのまま渡す。

## Step 7: 実行スクリプト

Step 4〜6 を実行する TypeScript スクリプトをその場で生成する。

ファイル名: `scripts/lab-demo-YYYY-MM-DD.ts`

インポート例:
```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { demoQuestionSets, demoReports } from "@anydigi-lab/database/schema/demo";
import { sql } from "drizzle-orm";
```

実行: `npx tsx scripts/lab-demo-YYYY-MM-DD.ts`

## Step 8: サマリー表示

```
## /lab-demo 実行完了（YYYY-MM-DD）

- 取得記事: X 件（ai/dx カテゴリ）
- トピック: 4 件
  1. [label] — [description]
  2. ...
- レポート生成: 32 件（4 トピック × 4 立場 × 2 深さ）
- intro: "[intro 全文]"
- question_set_id: X
```

## Step 9: デモ紹介の X 投稿を生成

Step 4 で保存した `intro`（または Neon `demo.question_sets.intro` を再取得）を素材にして、`/demo` ページへの導線になる X 投稿を生成する。

このステップで作るのは **X-post コマンドより先に書き込まれる投稿（#0）** なので、後で `/x-post` が同ファイルに #1〜 を追記してくる前提で動くこと。

### 投稿構成

**メイン投稿**（リンクなし）:
- 200〜260 字以内、日本語
- 中川さんの声（朝、ニュースを AI に整理させて読んだ感想ベース）
- intro をそのままコピーしない。intro が示す当日の論点から **1 テーマだけ拾って語る**
- 「今朝のニュース、AI に整理してもらって読んだら〜」のような、AI と一緒に読んでる体験を匂わせる 1 行を入れる
- 末尾に「↓ 今日の話題はリプから（4 つの立場別レポートで読めます）」のような誘導を 1 行
- ハッシュタグは付けない（または `#AnyDigi` 1 つまで）
- 1 行目で読み手を止める力を持たせる（数字・固有名詞・違和感のいずれか）

**セルフリプ**（リンク本体）:
```
今日のニュースを「経営者・現場マネージャー・企画・1 人会社」の 4 立場 × 2 つの深さで AI が読み分けます。3 つの質問に答えるだけ。

▶ https://lab.anydigi.co.jp/demo
```

### ファイル出力（先頭追加）

書き込み先: `.claude/outputs/posts/YYYY-MM-DD.md`

- ファイルが**存在しなければ新規作成**
- ファイルが**既に存在する場合は、ファイル先頭に #0 を挿入**（`/x-post` 由来の既存セクションは温存）
- セクションのヘッダーは `## #0 デモ紹介（朝）`
- メイン投稿と セルフリプは Markdown の `---` 区切りで分ける（既存の x-post 規約に揃える）

セクション例:
```markdown
## #0 デモ紹介（朝）

[メイン投稿本文]

---

[セルフリプ本文（リンク付き）]
```

### 投稿生成のセルフチェック

- [ ] intro の言葉をそのまま転記していない（必ず咀嚼している）
- [ ] AI と一緒に読んでいる体験が 1 行入っている
- [ ] メイン投稿にリンクを含めていない（リンクはセルフリプ専用）
- [ ] 売り込み臭がない（「ぜひ試してください」「便利です」のような押し付けは NG）
- [ ] 1 行目で手を止めさせる引きがある

## Step 10: 成功時のアーカイブ

サマリー表示・X 投稿生成まで成功した場合のみ、本実行で `scripts/` 配下に生成したスクリプト（`scripts/lab-demo-YYYY-MM-DD.ts`）を `scripts/archives/YYYY-MM/`（YYYY-MM は実行日の年月）へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/lab-demo-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない（再実行で内容を確認・修正できるよう残す）
- ディレクトリが既にあれば `mkdir -p` は no-op
- 複数ファイルを生成した場合は全て移動する
- 投稿ファイル（`.claude/outputs/posts/YYYY-MM-DD.md`）はアーカイブ対象外（`/x-post` がこの後追記する）

## 注意

- `revalidate = 3600` のため、ページ側のキャッシュは最長 1 時間遅延する。深夜実行なら朝までに伝搬する
- 同日 2 回実行しても `ON CONFLICT` で安全に上書きされる（content は最新で塗り替わる）
- 30 日以上前の question_sets / reports は将来 R2 アーカイブ対象（容量を気にし始めたら検討）
- 失敗したトピックがあっても他のトピックは続行する。最後にどのトピックが失敗したかを表示
