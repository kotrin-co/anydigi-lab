---
name: x-post
description: 今日の X 投稿の「ネタ」を複数カテゴリで集めてファイル出力する（投稿文は中川さんが自分で書く）
---

今日の X 投稿の **素材（ネタ）** を集めて 1 つの Markdown にまとめます。完成投稿文の生成は廃止。ネタを箇条書きで提示し、どれをどのタイミングでどのくらいの文字数で投稿するかは中川さんが個別に判断します。

## Step 0: 前提

- R2 上の RSS 記事は `scripts/lib/duckdb-r2.ts` の `fetchRssArticles()` で取得（`duckdb` npm 直叩き、Cube 経由しない）
- Neon の `insights.ideas` / `needradar.needs` / `demo.question_sets` は `mcp__neon__query` で取得
- 当日の `dt` は **R2 上の最新パーティション（UTC ベース）**。JST 早朝なら通常「JST 昨日 = UTC 同日 or 前日」が最新

## Step 1: 各カテゴリのソースを集める

以下のソースを **並列で** 取得する。失敗した枠は空欄でよく、他カテゴリは続行する。

### 1-1: 今日の天気（東京）

`WebFetch` で `https://tenki.jp/forecast/3/16/4410/13113/` を取得。最高 / 最低気温、天気概況、紫外線・降水確率など特筆点を 1〜3 行で。

### 1-2: Google Trends（日本の急上昇キーワード）

`WebFetch` で `https://trends.google.co.jp/trending/rss?geo=JP` を取得。上位 10〜20 件をキーワードと検索ボリュームで列挙。文脈が読み取れるものは 1 行注釈を付ける（「映画◯◯関連」「政界の話題」など）。

### 1-3: 今日は何の日

`WebFetch` で `https://www.nnh.to/MM/DD.html`（当日の月日に置換）を取得。記念日 / 国際デー / 歴史的出来事 / 著名人の誕生日を箇条書きで 4〜8 件。

### 1-4: 今日のニュース（朝の pipeline から）

**`/insights` から連続実行されている場合:** 会話コンテキストの記事一覧をそのまま使う。Step 1-4 のフェッチはスキップ。

**単体で実行された場合のみ:**

```typescript
import { fetchRssArticles, listRssDates } from "./lib/duckdb-r2";

async function main() {
  const dts = await listRssDates();
  const dt = dts[0];
  const arts = await fetchRssArticles({ dt, categories: ["ai", "dx"], limit: 100 });
  for (const a of arts) {
    const preview = (a.content ?? "").replace(/\s+/g, " ").slice(0, 280);
    console.log(`---\nSRC:${a.source_name}\nTITLE:${a.title}\nURL:${a.url}\nBODY:${preview}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

probe スクリプト（例: `scripts/_fetch.ts`）として生成・実行し、終わったら削除する。

### 1-5: 自分発信フックの素材（Neon から）

`mcp__neon__query` で以下を取得:

```sql
-- 今日の lab-demo の状況
SELECT id, generated_for_date::text, jsonb_array_length(topics) AS topic_count, intro,
       (SELECT COUNT(*) FROM demo.reports WHERE question_set_id = qs.id) AS report_count
FROM demo.question_sets qs
WHERE generated_for_date = (NOW() AT TIME ZONE 'Asia/Tokyo')::date;

-- 最新の active アイデア（上位スコア）
SELECT i.id, i.title, i.category,
       s.market, s.fit, s.timing, s.evidence,
       (s.market + s.fit + s.timing + s.evidence) AS total
FROM insights.ideas i
LEFT JOIN LATERAL (
  SELECT market, fit, timing, evidence FROM insights.idea_scores
  WHERE idea_id = i.id ORDER BY id DESC LIMIT 1
) s ON true
WHERE i.status = 'active'
ORDER BY total DESC NULLS LAST
LIMIT 10;

-- 直近で証拠が増えた active ニーズ
SELECT id, title, vertical, evidence_count, regions
FROM needradar.needs
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 10;

-- アクティブニーズ総数
SELECT COUNT(*)::int AS active_needs FROM needradar.needs WHERE status = 'active';
```

## Step 2: カテゴリごとに「ネタ」を整理

完成投稿文は作らない。**箇条書きの素材** だけ。各項目は 1〜3 行で、中川さんが投稿文に昇華しやすい粒度にする。

カテゴリは以下 8 枠で固定（順序もこの通り）:

1. **🌤 今日の天気（東京）** — 1-3 行（気温・概況・特筆点）
2. **🔍 Google Trends（急上昇）** — 10〜20 件。1 行注釈推奨
3. **📅 今日は何の日** — 4〜8 件。記念日 / 歴史 / 著名人誕生日
4. **📰 ニュース（今日の RSS から）** — 8〜13 件。大手・主要ニュースを箇条書き。各項目は「タイトル — どう料理できるかの一言」形式
5. **💰 経済・市場系** — 2〜5 件。株価・為替・原油・指標・IPO・決算など。「身近に何が起きているか」に翻訳できる粒度で
6. **🗾 日本独自ネタ** — 2〜5 件。日本でしか起きていない動き、海外発でも日本人視点で語れるもの
7. **🎯 自分発信フック** — 3〜6 件。Step 1-5 のデータをそのまま転記せず、「中川さんが自分の言葉で書ける角度」に整理して並べる
   - `/lab/demo` が今日生成済みなら「✅ /lab/demo の今日分が更新された（4 トピック × 32 レポート、intro 全文）」を含める
   - intro 全文も「素材」として併記しておく（中川さんが投稿に使う場合にコピペ可能なように）
   - スコア上位アイデア・直近で動いたニーズも 2〜3 件挙げる
   - 中川さん固有のフック（食品業界継承、元電力会社、Lab 進捗）に絡められそうな今日のニュースを 1〜2 件
8. **📰 業界誌の小ネタ（大手ニュースに埋もれがち）** — 10〜20 件。日経 xtech / itmedia monoist / publickey などのニッチ記事を中心に。「大手メディアでは扱われないが現場で効く動き」を拾う

### カテゴリの増減

- 「他にネタ源が見つかった」場合は追加してよい（例：書籍リリース、統計レポート、海外の生活実感など）
- ネタが拾えなかったカテゴリは見出しごと省略してよい（空セクションは作らない）

### 完成投稿文を作らない

- 「朝の挨拶」「夕方の挨拶」「ロングフォーム」などの完成投稿文の生成は **廃止**
- 投稿の文字数・口調・タイミングは中川さんが個別に決める。AI 側は素材だけ
- 添削依頼があれば別途対応する

## Step 3: ファイル出力

出力先: `.claude/outputs/posts/YYYY-MM-DD.md`（JST の当日日付）

書き込みルール:
- ファイルが **存在しなければ** 新規作成して、ネタセクションのみを書く
- ファイルが **既に存在する** 場合は、末尾に空行を確保した上で **追記** する（既存セクションは絶対に削除・改変しない）
- ネタ全体は以下の H1 セクションでまとめて格納する:

```markdown
# 今日のポストネタ（YYYY-MM-DD 曜）

## 🌤 今日の天気（東京）
...

## 🔍 Google Trends（急上昇）
...

（以下、Step 2 の 8 カテゴリを順番に）
```

曜日は Bash で `TZ=Asia/Tokyo date '+%A'` を取って正しく入れる。

## Step 4: 完了表示

```
## /x-post ネタ収集 完了（YYYY-MM-DD）

- 出力先: .claude/outputs/posts/YYYY-MM-DD.md
- 集めたネタ:
  - 天気: ◯
  - Google Trends: X 件
  - 今日は何の日: X 件
  - ニュース: X 件
  - 経済・市場: X 件
  - 日本独自: X 件
  - 自分発信フック: X 件
  - 業界誌の小ネタ: X 件
```

## 注意

- **完成投稿は作らない。** 素材のみ。中川さんが投稿文に昇華する
- 同じ記事を複数カテゴリにまたがって載せてよい（角度が違うなら重複歓迎）
- 「業界誌の小ネタ」は **大手ニュースで既出のものは除外** する。重複する場合は別の角度を抜き出す
- Google Trends RSS は提供件数が日によって変動する（10 件のみのこともある）。取得できた件数で書く
- 天気は東京（渋谷区）で固定。出張等で別地域指定の依頼があれば都度変更
- 添削・推敲は中川さんの依頼に応じて別途対応
