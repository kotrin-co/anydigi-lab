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

## Step 0: 前提

R2 上の parquet を読むのは `scripts/lib/duckdb-r2.ts` の `fetchRssArticles()` を使う（`duckdb` npm の直叩き、Cube 経由しない）。R2 認証は `.env` の `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` から自動で読まれる。

Cube は廃止済み。`apps/cube/` は履歴のために残してあるが、起動する必要はない。

## Step 1: 既存の question_set を確認

`mcp__neon__query` で本日分が既に生成済みかをチェック。

```sql
SELECT id, generated_for_date::text, jsonb_array_length(topics) AS topic_count,
  (SELECT COUNT(*) FROM demo.reports WHERE question_set_id = qs.id) AS report_count
FROM demo.question_sets qs
WHERE generated_for_date = (NOW() AT TIME ZONE 'Asia/Tokyo')::date
```

- 既に存在し、かつ `demo.reports` に紐付くレポートが 32 件揃っている場合 → 「本日分は生成済みです」と表示して終了
- レコードはあるが reports が不完全な場合 → 不足分のみ生成（再開）
- 何も無ければ → Step 2 から開始

## Step 2: 本日の RSS 記事を取得

その場で短い probe スクリプト（例: `scripts/_fetch.ts`）を生成して実行する。

```typescript
import { fetchRssArticles } from "./lib/duckdb-r2";

async function main() {
  const arts = await fetchRssArticles({
    dt: "YYYY-MM-DD",      // 当日 UTC の dt（R2 のパーティションキー）
    categories: ["ai", "dx"],
    limit: 100,
  });
  console.log(`COUNT=${arts.length}`);
  for (const a of arts) {
    const preview = (a.content ?? "").replace(/\s+/g, " ").slice(0, 280);
    console.log(`---\nID:${a.id}\nCAT:${a.source_category}\nSRC:${a.source_name}\nPUB:${a.published_at}\nTITLE:${a.title}\nURL:${a.url}\nBODY:${preview}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

`dt` は **R2 上の最新パーティション**（UTC ベース）を使う。JST 早朝に動かすと UTC ではまだ前日なので、`dt = 「JST 昨日」` が最新になりやすい。

- 0 件のときは前日の dt にフォールバック
- それでも 0 件なら「本日の対象記事はありません」と表示して終了
- probe スクリプトは Step 8 のアーカイブ対象外。Step 7 のスクリプト生成が終わったら削除してよい

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

トピック 4 × 立場 4 × 視点 2 = 32 レポート。Claude（あなた）が会話内で全 32 件を執筆する。LLM への外部呼び出しは不要（Claude Code 自体が分析者）。

### Role 定義

| value | label | 視点 |
|---|---|---|
| executive | 経営者・役員 | 全社戦略・投資判断・リスク |
| manager | 現場マネージャー | チーム運用・実装・KPI |
| planner | 企画・新規事業 | アイデア・市場機会・事業設計 |
| solo | 個人事業主・1人会社 | 1人で回す視点・小さく始める |

### View 定義（DB カラムは `depth` のままだが、内容は「視点（読者層）」で再解釈）

UI 上は「わかりやすく解説」を先頭に表示する。

| value | UI ラベル | 想定読者 | 出力量目安 | フレーム | 役割 |
|---|---|---|---|---|---|
| digest | わかりやすく解説 | 専門知識ゼロ（家族・知人・初学者でも分かる） | 300〜500 字 | 【ひと言でいうと】+【何が起きてる？】+【もう少し詳しく】 | **ニュースの内容を平易に解説するだけ**。示唆・打ち手・「あなたにどう関係する？」には踏み込まない |
| detailed | 分析レポートを見る | 業界感度ある人（経営層・企画・現場リーダー） | 600〜900 字 | 【3行サマリー】+【背景と動き】+【あなたへの示唆】+【今日できる一手】 | 立場別の示唆・打ち手まで踏み込む |

### Content フレーム（detailed = 分析レポート）

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

### Content フレーム（digest = わかりやすく解説）

**重要: このビューは「ニュースを平易な言葉で説明する」ことだけが目的。読者の立場別の示唆や打ち手は書かない**。たとえ立場が executive / manager / planner / solo であっても、内容は「事実 + 平易な背景説明」のみで、立場ごとの差は最小限（または無し）でよい。

```
【ひと言でいうと】
1〜2 文でニュースの核心。中学生に話すつもりで、専門用語ゼロで。
固有名詞は出してよい（OpenAI、Anthropic 等の社名）。

【何が起きてる？】
状況解説を 150〜250 字。誰が・何を・いつ、を平易に。
専門用語が出てきたら必ず言い換えるか、括弧で日常言葉の補足を入れる。

【もう少し詳しく】
背景や前提知識を 100〜200 字で補足する。
例え話を 1 つは入れる（「これは喩えるなら…」）。
ここでも示唆や打ち手には踏み込まず、純粋に「何の話なのか」を平らに伝える。
```

**やってはいけないこと（digest）:**
- 「あなたにどう効くか」「経営層は…」のような立場別の示唆を入れない
- 「今日できる一手」「明日からできること」のような行動提案を入れない
- 評価・推奨・警告の口調を避ける（「〜すべき」「要注意」を使わない）
- 「これは大きな転換点」のような断定的な意義付けはしない（事実と背景に留める）

**立場（role）の扱い:**
- digest は「立場に依らない平易な解説」を目的とするため、同じ topic に対する 4 役職分の digest は **基本的に同一内容** で OK（4 行を同じ content で INSERT する）
- title だけは立場が分かるよう微調整しても、しなくてもよい（無理に変える必要はない）

### 「わかりやすく解説」用の言い換えルール（必須）

専門用語が出たら必ず以下のように置換または補足すること。

| 専門用語 | 言い換え |
|---|---|
| ハルシネーション | AI が自信満々に嘘をつくこと |
| エージェント | 勝手に動く AI |
| API | 他のソフトとつなぐ口 |
| マルチモーダル | 文字も絵も両方読める AI |
| ガバナンス | 使い方のルールづくり |
| データセンター | AI を動かすための巨大なサーバー部屋 |
| LLM / 大規模言語モデル | 文章を書ける AI の本体 |
| プロンプト | AI への指示文 |
| トークン | AI が読み書きする文字の単位（1 トークン ≈ ひらがな 1 文字くらい） |
| ベンダーロック | 1 つの会社の道具に縛られて抜けられない状態 |
| サプライチェーン攻撃 | ソフトの「部品」に毒を仕込まれる攻撃 |
| ファインチューニング | AI を自社用に追加で勉強させること |
| RAG | 自社の資料を AI に「カンペ」として渡す仕組み |
| 推論コスト | AI を 1 回動かすのにかかるお金 |
| エンタープライズ | 大企業向け |
| SaaS | ネット経由で使える月額ソフト |

表にない用語が出てきた場合も、必ず初出時に **括弧で日常言葉の説明** を入れること。
例: 「Codex（OpenAI が作った、コードを自動で書く AI）が…」

### 共通ルール（両 view 共通）

- title は 16〜28 字程度、立場が一目で分かるように
- 記事の固有名詞・数字は冒頭セクションに入れる
- 推測の事実は断定しない（「〜と報じられています」「〜と考えられます」）
- 「今日できる一手」「明日からできること」は抽象的提案を避け、すぐ着手できる粒度で書く
- セクション見出し【】は全角括弧、本文と空行で区切る

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

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const TODAY = "YYYY-MM-DD";
const INTRO = "...";
const TOPICS = [ /* 4 件 */ ];
const REPORTS = [ /* 32 件 */ ];

async function main() {
  const upserted = await sql.query(
    `INSERT INTO demo.question_sets (generated_for_date, topics, intro, status)
     VALUES ($1, $2::jsonb, $3, 'active')
     ON CONFLICT (generated_for_date) DO UPDATE
       SET topics = EXCLUDED.topics, intro = EXCLUDED.intro
     RETURNING id`,
    [TODAY, JSON.stringify(TOPICS), INTRO]
  );
  const questionSetId = (upserted as Array<{ id: number }>)[0].id;
  // ... reports loop with ON CONFLICT DO UPDATE
}
```

実行: `npx tsx scripts/lab-demo-YYYY-MM-DD.ts`

### Step 7-2: ISR の即時 invalidate（必須）

書き込み完了後、本番フロント（`/demo`）の ISR キャッシュを即座に無効化する。これを呼ばないと最大 1 時間、初回アクセスのユーザーが fallback トピック（`page.tsx` の `FALLBACK_TOPICS`）を踏み、Q3 で「このパターンのレポートはまだ準備中です」が出る。

スクリプト末尾に下記を追加する:

```typescript
async function revalidateDemo() {
  const url = process.env.LAB_REVALIDATE_URL ?? "https://lab.anydigi.co.jp/api/revalidate-demo";
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    console.warn("⚠ REVALIDATE_TOKEN が未設定、revalidate をスキップ");
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-revalidate-token": token },
  });
  if (!res.ok) {
    console.warn(`⚠ revalidate failed: ${res.status} ${await res.text()}`);
    return;
  }
  console.log(`✓ revalidated /demo`);
}

// main() の最後で
await revalidateDemo();
```

`.env` と Vercel Project Settings の双方に `REVALIDATE_TOKEN` を同じ値で設定する必要がある。エンドポイント実装は `apps/web/src/app/api/revalidate-demo/route.ts`。

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

## Step 9: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で `scripts/` 配下に生成したスクリプト（`scripts/lab-demo-YYYY-MM-DD.ts`）を `scripts/archives/YYYY-MM/`（YYYY-MM は実行日の年月）へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/lab-demo-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない（再実行で内容を確認・修正できるよう残す）
- Step 2 で作った probe スクリプトはアーカイブ対象外。削除してよい

## デモ紹介の X 投稿について

デモ紹介の X 投稿生成はこのコマンドからは **廃止**。`intro` と `question_set_id` は `demo.question_sets` に保存されているので、`/x-post` の「自分発信フック」枠が当日分を Neon から読み取り、素材として並べる構成に統一済み。

## 注意

- `revalidate = 3600` だが Step 7-2 で即時 invalidate するため、書き込み完了後の初回アクセスでも fallback を踏まない。**Step 7-2 を省略すると最大 1 時間 fallback が出る**ので必ず呼ぶ
- 同日 2 回実行しても `ON CONFLICT` で安全に上書きされる（content は最新で塗り替わる）
- 30 日以上前の question_sets / reports は将来 R2 アーカイブ対象（容量を気にし始めたら検討）
- 失敗したトピックがあっても他のトピックは続行する。最後にどのトピックが失敗したかを表示
