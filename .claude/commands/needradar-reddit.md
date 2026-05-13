---
name: needradar-reddit
description: ローカルから Reddit を直接フェッチしてニーズを抽出し needradar.needs に蓄積する（R2/Cube 経由しない）
---

NeedRadar のニーズ収集（Reddit 版）を実行します。

## なぜ R2/Cube を経由しないか

Reddit はデータセンター IP（Cloud Functions 含む GCP/AWS/Azure）からの未認証 `.json` アクセスを 403 + HTML エラーページで弾く仕様。一方、住宅 ISP IP（あなたのローカル Mac）からは `User-Agent` を付けるだけで 200 + JSON が返ります。よって本コマンドは:

- **収集はローカル `npx tsx` 直接 fetch**（Cloud Functions 廃止）
- **R2 を経由しない**（書き手も読み手もこのスクリプト 1 箇所だけなので層を 1 つ削る）
- **その場の JSON を Claude が直接読み、`needradar.needs` に upsert**

`apps/functions/src/services/reddit-service.ts` および旧 `reddit_posts` cube model（Cube 自体 2026-05-13 廃止）は本コマンドからは参照しません。

## Step 0: 前提

- `.env` に `DATABASE_URL`（Neon）と `OPENAI_API_KEY`（embedding 用）が設定されている
- 取得対象は `apps/functions/src/constants/reddit.ts` の `REDDIT_SOURCES`（12 subreddit、6 カテゴリ）
- User-Agent / 6 秒間隔も同ファイルの定数を流用

## Step 1: スクリプト生成 — 収集フェーズ

ファイル名: `scripts/needradar-reddit-YYYY-MM-DD.ts`（YYYY-MM-DD は JST 本日）

このスクリプトは **収集 → JSON 中間ファイル出力**まで担当する。
Reddit fetch は約 1 分 12 秒（12 sub × 6 秒間隔）。

```typescript
import "dotenv/config";
import * as fs from "node:fs/promises";
import {
  REDDIT_SOURCES,
  REDDIT_BASE_URL,
  REDDIT_USER_AGENT,
  REDDIT_REQUEST_INTERVAL_MS,
  type RedditSource,
} from "../apps/functions/src/constants/reddit";

type CollectedPost = {
  post_id: string;
  subreddit: string;
  category: RedditSource["category"];
  language: RedditSource["language"];
  title: string;
  selftext: string;
  permalink: string;
  url: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  over_18: boolean;
  stickied: boolean;
  created_utc: number;
};

const TODAY = new Date().toISOString().slice(0, 10);
const OUT = `tmp/reddit-${TODAY}.json`;
const MIN_SCORE = 50;

async function fetchSubreddit(source: RedditSource): Promise<CollectedPost[]> {
  const sort = source.sort ?? "hot";
  const limit = source.limit ?? 100;
  const url = `${REDDIT_BASE_URL}/r/${source.subreddit}/${sort}.json?limit=${limit}`;

  const res = await fetch(url, { headers: { "User-Agent": REDDIT_USER_AGENT } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Reddit ${res.status} on ${url}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { children: Array<{ data: any }> } };

  return json.data.children.map((c) => ({
    post_id: c.data.id,
    subreddit: source.subreddit,
    category: source.category,
    language: source.language,
    title: c.data.title,
    selftext: c.data.selftext ?? "",
    permalink: `https://reddit.com${c.data.permalink}`,
    url: c.data.url,
    score: c.data.score,
    upvote_ratio: c.data.upvote_ratio,
    num_comments: c.data.num_comments,
    over_18: c.data.over_18,
    stickied: c.data.stickied,
    created_utc: c.data.created_utc,
  }));
}

async function main() {
  console.log(`▶ collecting Reddit posts (${REDDIT_SOURCES.length} subreddits)`);
  const all: CollectedPost[] = [];
  const errors: string[] = [];

  for (const source of REDDIT_SOURCES) {
    try {
      const posts = await fetchSubreddit(source);
      all.push(...posts);
      console.log(`  ✓ r/${source.subreddit}: ${posts.length}`);
    } catch (e) {
      console.error(`  ✗ r/${source.subreddit}: ${(e as Error).message}`);
      errors.push(source.subreddit);
    }
    await new Promise((r) => setTimeout(r, REDDIT_REQUEST_INTERVAL_MS));
  }

  // タイトル長と score でフィルタ。stickied/over_18 は除外。
  const filtered = all.filter(
    (p) =>
      !p.stickied &&
      !p.over_18 &&
      p.title.length >= 15 &&
      p.title.length <= 300 &&
      p.score >= MIN_SCORE
  );

  await fs.mkdir("tmp", { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(filtered, null, 2));

  console.log(`\n— summary —`);
  console.log(`  fetched: ${all.length}`);
  console.log(`  filtered (score >= ${MIN_SCORE}): ${filtered.length}`);
  console.log(`  errors: ${errors.length}${errors.length ? ` (${errors.join(", ")})` : ""}`);
  console.log(`  output: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

実行: `npx tsx scripts/needradar-reddit-YYYY-MM-DD.ts`

**注意:**
- 全 subreddit が失敗（403 連発）した場合は **IP/UA に問題あり**。`curl -A "AnyDigiLabBot/1.0 by /u/<ユーザー>" https://www.reddit.com/r/startups/hot.json` で住宅 IP から JSON が返るか確認
- 一部失敗は ToS 順守の 6 秒間隔を守っている限り稀。エラーリスト `errors` にだけ載せて続行する設計
- 出力 `tmp/reddit-YYYY-MM-DD.json` は Step 2 で読む。アーカイブ対象ではない（`.gitignore` に `tmp/` を入れておく）

## Step 2: 中間 JSON を読み、ニーズを抽出

Claude（あなた）が `tmp/reddit-YYYY-MM-DD.json` を Read ツールで読み、以下の判断基準で抽出する。**この時点ではまだ DB を触らない**。

**採用基準:**
- 「How do I...」「Anyone else struggling with...」「I wish there was...」「Need help with...」など具体的な困りごと
- 同じ subreddit 内で類似の不満が複数投稿に出ている
- score / upvote_ratio / num_comments が高い（コミュニティの共感・関心が強い）

**除外基準:**
- 自己宣伝・サクセスストーリー・収益報告（"I made $XX"）
- ミーム・ジョーク・雑談
- 政治・宗教的意見
- 既存 SaaS の単純なレコメンド質問（"What's the best CRM?"）
- AI/ML の研究論文紹介・モデルリリース報告（実装相談を除く）

**vertical の分類:**
- `food`: 食品・飲食・農業（r/FoodBusiness, r/restauranteur 中心）
- `manufacturing`: 製造・工場・現場
- `creative`: 制作・デザイン・コンテンツ
- `general`: その他

**region 推定:**
- `subreddit` が `Japan` / `JapanLife` または `language = 'ja'` → `JP`
- それ以外の英語圏 → `US`（欧州圏は現状 US に丸める）

## Step 3: 既存ニーズの確認

`mcp__neon__query` で取得:

```sql
SELECT id, title, vertical, evidence_count, sources, regions
FROM needradar.needs
WHERE status = 'active'
ORDER BY evidence_count DESC
```

## Step 4: 抽出結果を画面表示

```
## 新規ニーズ候補

### [ニーズタイトル]
- **要約:** [1-2文]
- **vertical:** food / manufacturing / creative / general
- **証拠投稿:** [score, upvote_ratio] "[title 抜粋]" (r/subreddit, region: JP/US)

## 既存ニーズへの証拠追加

### [既存ニーズタイトル]（id: X, 現在 evidence_count: Y）
- **証拠投稿:** [score, upvote_ratio] "[title 抜粋]" (r/subreddit, region: JP/US)

## スキップ
- [スキップ理由を一言]
```

## Step 5: スクリプト生成 — 書き込みフェーズ

ファイル名: `scripts/needradar-reddit-write-YYYY-MM-DD.ts`

書き込み専用スクリプトを生成し実行する。**embedding 類似度 0.80 で dedup** する点は従来と同じ。

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  generateEmbedding,
  findSimilarNeeds,
} from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const sql = client;
const db = drizzle(client);

type NewNeed = {
  title: string;
  summary: string;
  vertical: "food" | "manufacturing" | "creative" | "general";
  region: "JP" | "US" | "EU";
  source: string; // permalink
};

type EvidenceAdd = {
  needId: number;
  region: "JP" | "US" | "EU";
  source: string; // permalink
  note: string;
};

const NEW_NEEDS: NewNeed[] = [
  // Step 4 で抽出したものをここに展開
];

const EVIDENCE: EvidenceAdd[] = [
  // 既存ニーズに紐付ける証拠
];

async function upsertNew(n: NewNeed) {
  const embedding = await generateEmbedding(`${n.title}\n${n.summary}`);
  const similar = await findSimilarNeeds(db, embedding, 0.8);

  if (similar.length > 0) {
    // 類似あり: 既存に統合
    const target = similar[0];
    await sql.query(
      `UPDATE needradar.needs
         SET evidence_count = evidence_count + 1,
             sources = CASE WHEN $2 = ANY(sources) THEN sources ELSE array_append(sources, $2) END,
             regions = CASE WHEN $3 = ANY(regions) THEN regions ELSE array_append(regions, $3) END,
             updated_at = NOW()
       WHERE id = $1`,
      [target.id, n.source, n.region]
    );
    return { merged: true, id: target.id, similarity: target.similarity };
  }

  // 新規: INSERT
  const vectorStr = `[${embedding.join(",")}]`;
  const inserted = (await sql.query(
    `INSERT INTO needradar.needs (title, summary, vertical, evidence_count, sources, regions, embedding, status)
     VALUES ($1, $2, $3, 1, ARRAY[$4]::text[], ARRAY[$5]::text[], $6::vector, 'active')
     RETURNING id`,
    [n.title, n.summary, n.vertical, n.source, n.region, vectorStr]
  )) as Array<{ id: number }>;
  return { merged: false, id: inserted[0].id };
}

async function addEvidence(e: EvidenceAdd) {
  await sql.query(
    `UPDATE needradar.needs
       SET evidence_count = evidence_count + 1,
           sources = CASE WHEN $2 = ANY(sources) THEN sources ELSE array_append(sources, $2) END,
           regions = CASE WHEN $3 = ANY(regions) THEN regions ELSE array_append(regions, $3) END,
           updated_at = NOW()
     WHERE id = $1`,
    [e.needId, e.source, e.region]
  );
}

async function main() {
  console.log(`▶ /needradar-reddit write phase`);
  let newCount = 0;
  let mergedCount = 0;

  for (const n of NEW_NEEDS) {
    const r = await upsertNew(n);
    if (r.merged) {
      mergedCount++;
      console.log(`  → merged into #${r.id} (sim=${r.similarity?.toFixed(3)})`);
    } else {
      newCount++;
      console.log(`  ✓ new #${r.id}: ${n.title}`);
    }
  }

  for (const e of EVIDENCE) {
    await addEvidence(e);
    console.log(`  +1 evidence to #${e.needId}`);
  }

  const total = (await sql.query(
    `SELECT COUNT(*)::int AS n FROM needradar.needs WHERE status = 'active'`
  )) as Array<{ n: number }>;

  console.log(`\n— summary —`);
  console.log(`  new needs: ${newCount}`);
  console.log(`  merged into existing: ${mergedCount}`);
  console.log(`  evidence added: ${EVIDENCE.length}`);
  console.log(`  active needs total: ${total[0].n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

実行: `npx tsx scripts/needradar-reddit-write-YYYY-MM-DD.ts`

## Step 6: サマリー表示

```
## /needradar-reddit 完了（YYYY-MM-DD）

- 取得投稿: X件
- 分析対象（score >= 50）: X件
- 新規ニーズ: X件
- 既存ニーズへ統合（embedding sim >= 0.80）: X件
- 既存ニーズへ証拠追加: X件
- アクティブニーズ総数: X件
- 失敗 subreddit: X件 (... または「なし」)
```

## Step 7: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で `scripts/` 配下に生成した 2 本（`needradar-reddit-YYYY-MM-DD.ts` と `needradar-reddit-write-YYYY-MM-DD.ts`）を `scripts/archives/YYYY-MM/` へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/needradar-reddit-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
mv scripts/needradar-reddit-write-YYYY-MM-DD.ts scripts/archives/YYYY-MM/
```

- 失敗・中断時は移動しない（再実行で確認・修正できるよう残す）
- `tmp/reddit-YYYY-MM-DD.json` はアーカイブ対象外（`tmp/` は `.gitignore` で除外、不要なら手動削除）

## 注意・運用

- **Mac が起動していないと収集できない**。深夜 launchd で回す場合はスリープ防止設定が必要
- **GCP 等のクラウドからは絶対に動かない**（403 + HTML が返る）。ローカル ISP IP のみ
- 6 秒間隔は Reddit ToS 順守。短縮しない
- すべての subreddit が連続 403 なら、`User-Agent` に実在 Reddit ユーザー名（`/u/<実在>`）を入れる、または OAuth 化を検討
- YouTube は YouTube Data API v3（API key）なので IP ブロックの影響を受けず、別 skill `needradar-youtube` 側は従来どおり R2/Cube 経由を維持
