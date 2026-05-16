---
name: morning
description: 毎朝の日次実行をまとめて回す（lab-demo → insights → needs → x-post）
---

毎朝の AI 分析パイプラインをまとめて実行します。

## 実行順序

`lab-demo` → `insights` → `needs` → `x-post` の順で実行する。

理由:
1. **lab-demo が先**: `/demo` ページ（潜在顧客向け公開デモ）の本日分を最優先で揃える。R2 の rss/articles を `scripts/lib/duckdb-r2.ts` 経由で直接読むだけなので、依存も軽い
2. **insights が次**: 同じ rss/articles を読み込んでビジネスアイデアを抽出する。lab-demo と入力ソースが同じなので DuckDB の R2 メタデータキャッシュが効きやすい
3. **needs が三番目**: Reddit / YouTube 側のデータ取得は時間がかかるため、影響範囲が独立している needs を後ろに回す（前段が落ちても needs は走らせたい）
4. **x-post が最後**: lab-demo の intro / insights のスコア上位アイデア / needs の動いたニーズを「自分発信フック」枠の素材として使うため、3 つすべてが終わってから走らせる

## Step 1: /lab-demo を実行

`.claude/commands/lab-demo.md` の手順を **そのまま全部** 実行する（Step 1〜8）。

完了後、下記をこの会話コンテキストに保持する:
- 取得記事数 / 抽出トピック 4 件 / レポート 32 件投入
- question_set_id
- intro 全文

失敗した場合は、失敗内容を表示してから **Step 2 に進む**（止めない）。

## Step 2: /insights を実行

`.claude/commands/insights.md` の手順を **そのまま全部** 実行する。

完了後、下記をこの会話コンテキストに保持する:
- 取得記事数
- 新規アイデア数 / 既存アイデアへの証拠追加数
- アクティブアイデア総数

失敗した場合は、失敗内容を表示してから **Step 3 に進む**。

## Step 3: /needs を実行

`.claude/commands/needs.md` の手順を **そのまま全部** 実行する（Reddit → YouTube）。

完了後、下記をこの会話コンテキストに保持する:
- Reddit / YouTube それぞれの新規ニーズ数・証拠追加数
- アクティブニーズ総数

## Step 4: /x-post を実行

`.claude/commands/x-post.md` の手順を **そのまま全部** 実行する。

連続実行時の挙動:
- x-post 側の Step 1-4（ニュース）は朝の pipeline で取得済みの記事一覧をそのまま使う（probe スクリプトは生成しない）
- 自分発信フック枠（Step 1-5）は lab-demo の `question_set_id` / intro / insights のスコア上位アイデア / needs の直近動いたニーズをそのまま素材化する

完了後、下記をこの会話コンテキストに保持する:
- 出力先パス（`.claude/outputs/posts/YYYY-MM-DD.md`）
- 集めたネタの件数（カテゴリ別）

失敗した場合は、失敗内容を表示してから **Step 5 のサマリー** に進む（止めない）。

## Step 5: 朝のまとめサマリー

4 つすべての実行が終わったら、下記を 1 つのブロックで表示する:

```
## 朝の日次パイプライン 完了（YYYY-MM-DD）

### lab-demo
- question_set_id: X
- 取得記事: X 件
- トピック: 4 件 / レポート: 32 件
- intro: "[intro 全文]"

### insights
- 取得記事: X 件
- 新規アイデア: X 件
- 証拠追加: X 件
- アクティブアイデア総数: X 件

### needs
- Reddit  新規 X / 証拠 X
- YouTube 新規 X / 証拠 X
- アクティブニーズ総数: X 件

### x-post
- 出力先: .claude/outputs/posts/YYYY-MM-DD.md
- 集めたネタ: 天気 ◯ / Trends X / 何の日 X / ニュース X / 経済 X / 日本独自 X / 自分発信 X / 業界誌 X

### 失敗・要確認
- (なければ「なし」)
- 失敗があった場合はどのコマンドの何 Step で何が落ちたかを 1 行で
```

## 注意

- どれかが失敗しても、残りは必ず実行する（止めない）
- 各コマンドの内部スクリプトは `scripts/` 配下に当日の日付付きで生成される
- R2 アクセスは `scripts/lib/duckdb-r2.ts` 経由（`duckdb` npm の直叩き）。**Cube は 2026-05-13 廃止**。`apps/cube/` は履歴のためだけに残してある、起動不要
- Claude Max の 5 時間ローリング窓を考慮し、深夜〜早朝に launchd で実行する想定。日中の手動実行は避ける
- **needradar-reddit はローカル Mac から Reddit に直接 fetch する**（Cloud Functions 経由しない）。Mac が起動していないと Step 3 の Reddit 部分はスキップされる
- needradar-reddit は `scripts/needradar-reddit-YYYY-MM-DD.ts`（収集）と `scripts/needradar-reddit-write-YYYY-MM-DD.ts`（書き込み）の 2 本を生成する
