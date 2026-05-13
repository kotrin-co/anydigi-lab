---
name: insights
description: R2 から RSS 記事を直 DuckDB で取得し、ビジネスアイデアを抽出・スコアリングして Neon に蓄積する
---

insights モジュールの日次分析を実行します。

## Step 0: 前提

R2 上の parquet を読むのは `scripts/lib/duckdb-r2.ts` の `fetchRssArticles()` を使う（`duckdb` npm の直叩き、Cube 経由しない）。R2 認証は `.env` の `R2_*` から自動で読まれる。

Cube は廃止済み。`apps/cube/` は履歴のために残してあるが、起動する必要はない。

## Step 1: 記事を取得

その場で短い probe スクリプト（例: `scripts/_fetch.ts`）を生成して実行する。

```typescript
import { fetchRssArticles } from "./lib/duckdb-r2";

async function main() {
  const arts = await fetchRssArticles({
    dt: "YYYY-MM-DD",      // R2 上の最新 dt（UTC ベース）
    categories: ["ai", "dx"],
    limit: 30,
  });
  console.log(`COUNT=${arts.length}`);
  for (const a of arts) {
    const preview = (a.content ?? "").replace(/\s+/g, " ").slice(0, 280);
    console.log(`---\nID:${a.id}\nCAT:${a.source_category}\nSRC:${a.source_name}\nPUB:${a.published_at}\nTITLE:${a.title}\nURL:${a.url}\nBODY:${preview}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

**注意:**

- `dt` は **R2 上の最新パーティション**（UTC ベース）を使う。JST 早朝に動かすと UTC ではまだ前日なので、`dt = 「JST 昨日」` が最新になりやすい
- `content` はアイデア抽出に使うが Neon には保存しない
- 記事が 0 件の場合は「本日の新着記事はありません」と表示して終了
- probe スクリプトは Step 7 のアーカイブ対象外。Step 4 のスクリプト生成が終わったら削除してよい

## Step 2: 既存アイデアの確認

`mcp__neon__query` で `status = 'active'` のアイデアを全件取得し、現在のアイデア一覧を把握する（最新スコア付き）:

```sql
SELECT i.id, i.title, i.category,
  COALESCE(s.market, 0) AS market,
  COALESCE(s.fit, 0) AS fit,
  COALESCE(s.timing, 0) AS timing,
  COALESCE(s.evidence, 0) AS evidence
FROM insights.ideas i
LEFT JOIN LATERAL (
  SELECT market, fit, timing, evidence
  FROM insights.idea_scores
  WHERE idea_id = i.id ORDER BY id DESC LIMIT 1
) s ON true
WHERE i.status = 'active' ORDER BY i.id
```

## Step 3: アイデア抽出（2系統）

記事ごとに以下を判断する。

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

- embedding による重複チェックを行う（Step 4 のスクリプト内で実行）:
  1. `generateEmbedding(title + "\n" + summary)` でベクトル生成
  2. `findSimilarIdeas(db, embedding, 0.80)` で既存アイデアと照合
  3. 類似度 80% 以上のアイデアが存在 → 新規ではなく既存アイデアへの evidence として扱う
  4. 類似度 80% 未満 → 新規アイデアとして insert（embedding も一緒に保存）
- ユーティリティは `@anydigi-lab/database/embedding` の `generateEmbedding` / `findSimilarIdeas` を使用
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

## Step 4: スクリプト生成 & 実行

`scripts/insights-YYYY-MM-DD.ts` を生成する。スクリプトは以下を順に実行:

1. `insights.articles` への upsert（`ON CONFLICT (id) DO NOTHING`）
2. 新規アイデア候補について `generateEmbedding` → `findSimilarIdeas(0.8)` → 類似なし: `INSERT` / 類似あり: 該当 idea_id への evidence に格納
3. 既存アイデアへの evidence 追加（`insights.idea_evidence`）
4. 新規アイデアに初期スコア（`insights.idea_scores`）

### スコアリング

新規アイデアには以下の4軸で 1-10 のスコアを付与する:

| 軸       | 観点                                             |
| -------- | ------------------------------------------------ |
| market   | 市場規模・成長性。ターゲット顧客がどれだけいるか |
| fit      | AnyDigiの強み（データ×AI基盤）との適合度         |
| timing   | 今やるべきか。市場の成熟度、競合状況             |
| evidence | 裏付けの強さ。記事数、具体性、実例の有無         |

実行: `npx tsx scripts/insights-YYYY-MM-DD.ts`

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

rerank は Step 4 のスクリプト内に同梱する（`RERANK_SCORES` 定数を持たせて `insertScore` を全件に発行）。

## Step 6: サマリー表示

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

`.claude/commands/hp.md` の手順に従い、前日分のHPアクセスデータを分析・Neon蓄積する。これは BQ MCP 経由（GA4 export）で R2 直読みとは別経路。

## Step 8: X 投稿の生成

`.claude/commands/x-post.md` の手順に従い、X投稿を生成する。

このステップは insights の続きとして実行されるため、Step 1〜6 で取得・生成した記事データ・アイデア・スコアをそのまま引き継ぐ。x-post 側の Step 1-1, 1-2 はスキップされる。

## Step 9: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で生成したスクリプトを `scripts/archives/YYYY-MM/` に移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/insights-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない
- probe スクリプト（Step 1 の `_fetch.ts`）はアーカイブ対象外。削除してよい
