# 日本株高配当 スクリーニング & 分析

Yahoo配当利回りランキング → IRバンク財務データ → 8項目スコアリング → Tier S/A 業種・成長性分析 を実行し、`/trade/jp-high-dividend` 配下のページが表示するデータを Neon に書き込む。

## アーキテクチャ前提

- 収集 (Yahoo + IRバンク) → 永続 (Neon `trade.stock_profiles` / `trade.stock_financials`) → スクリーニング (Neon `trade.stocks` / `trade.screening_batches`) → AI分析 (Claude が `trade.stocks` の business/tailwinds/headwinds/...と `trade.portfolio_summaries` を更新)
- フロントは **最新バッチ** を `screeningBatches.createdAt DESC` で取得して描画する。バッチを作るたびにそれが本番表示になる
- `stock_profiles` / `stock_financials` は四半期マスター。同日内の再実行ではスキップされる

## 実行手順

### Step 1: IRバンク財務データの蓄積（四半期、必要時のみ）

`stock_profiles.last_crawled_at` から90日経過した銘柄のみ再取得する。前回から3ヶ月以内ならスキップしてよい。

```bash
npx tsx scripts/crawl-irbank.ts
```

オプション:
- `--limit N` 先頭N銘柄のみ（テスト用）
- `--force` last_crawled_at 無視で全件再取得
- `--min-yield N` 最低利回り（デフォルト 3.0%）

実行時間目安: 全件で15〜20分（IRバンクへのレート制限のため2秒sleepあり）

### Step 2: スクリーニング & スコアリング（毎回実行）

Yahoo配当利回りランキングを取得し、Neon 蓄積済みの財務データと突き合わせて 8項目財務スコアを計算、`screening_batches` と `stocks` に格納する。

```bash
npx tsx scripts/screen-jp-dividend.ts
```

オプション:
- `--dry-run` DB書き込みせずトップ15だけ表示
- `--limit N` 先頭N銘柄
- `--min-yield N` 最低利回り

このステップで自動付与されるもの:
- `tier` (S=90+ / A=80-89 / B=50-79 / C=<50、失格はnull)
- `recommendedPosition` ("core" or "satellite"、Tier S のみ自動付与)
- 8項目スコア内訳 + `financialScoreRaw`
- `industryScore100`、`compositeScore`

**ここまでで一覧ページ `/trade/jp-high-dividend` は表示可能になる。** ただし PER/PBR/ROE/割安度 の列は空（次の Step で補完）。詳細ページ用の AI 分析データもまだ空。

### Step 2.5: Tier S/A の PER/PBR/ROE 補完

Yahoo Finance 個別銘柄ページから PER/PBR/ROE を取得し、`stocks` を更新する。あわせて `valuationScore` / `compositeScore` を再計算する。Tier B/C や全件にやると 1,000+ 銘柄で時間がかかるので、表示上重要な Tier S/A のみに絞る運用。

```bash
npx tsx scripts/enrich-tier-sa-valuation.ts
```

オプション:
- `--batch-id N` 対象バッチを指定（省略時は最新）
- `--tiers S,A` 対象 Tier（省略時は S,A）

実行時間目安: Tier S/A 約50銘柄で **1〜2分**（1.5秒sleepあり）

これで一覧の `PER` / `PBR` / `ROE` / `割安度` 列と、詳細カードの `RIM比率` 表示が埋まる。

### Step 3: 最新バッチ ID と Tier S/A 銘柄の確認

```bash
npx tsx -e "
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { screeningBatches, stocks } from '@anydigi-lab/database/schema/trade';
const db = drizzle(neon(process.env.DATABASE_URL!));
const [batch] = await db.select().from(screeningBatches)
  .where(eq(screeningBatches.genre, 'jp-high-dividend'))
  .orderBy(desc(screeningBatches.createdAt)).limit(1);
console.log('latest batch:', batch.id, batch.generatedAt);
const tierStocks = await db.select({ code: stocks.code, name: stocks.name, tier: stocks.tier, industry: stocks.industry, financialScoreRaw: stocks.financialScoreRaw, yieldPct: stocks.yieldPct, per: stocks.per, pbr: stocks.pbr, roe: stocks.roe })
  .from(stocks).where(and(eq(stocks.batchId, batch.id), inArray(stocks.tier, ['S','A'])))
  .orderBy(desc(stocks.financialScoreRaw));
console.log(JSON.stringify(tierStocks, null, 2));
"
```

このコマンドが返す `latest batch: <id>` を以降のステップで使う。

### Step 4: Tier S/A 銘柄の業種・成長性分析（Claude が実施）

Step 3 で取得した Tier S/A 銘柄ごとに WebSearch で最新の業界動向・直近決算・関連ニュースを確認し、以下フィールドを生成する。

| フィールド | 内容 |
|---|---|
| `business` | 事業内容の概要（1〜2文。主力事業・収益モデル・財務特徴） |
| `tailwinds` | 追い風（構造的成長ドライバー、3〜5項目） |
| `headwinds` | 逆風（リスク・競合、3〜5項目） |
| `growthComment` | 成長性の総合コメント（1〜2文） |
| `dividendSustainability` | `very_high` / `high` / `mid_high` / `mid` / `low` |
| `recommendedPosition` | `core` / `satellite` / `watchlist`（Step 2 で自動付与済みの値を尊重しつつ、必要なら上書き） |
| `watchPoints` | 監視ポイント（短いキーワード、3項目程度） |

書き込みは下記スクリプトを `scripts/save-tier-s-reports.ts` をベースに作成して実行する（毎回 BATCH_ID をハードコードせず、最新バッチを取得する形に書き換えること）。出力先は `scripts/save-tier-reports-{YYYY-MM-DD}.ts`。

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));

const reports = [
  {
    code: "XXXX",
    business: "...",
    tailwinds: ["...", "..."],
    headwinds: ["...", "..."],
    growthComment: "...",
    dividendSustainability: "high",
    recommendedPosition: "core",
    watchPoints: ["...", "..."],
  },
  // Tier S + A 全銘柄分
];

async function main() {
  const [batch] = await db.select().from(screeningBatches)
    .where(eq(screeningBatches.genre, "jp-high-dividend"))
    .orderBy(desc(screeningBatches.createdAt)).limit(1);

  for (const r of reports) {
    const result = await db.update(stocks).set({
      business: r.business,
      tailwinds: r.tailwinds,
      headwinds: r.headwinds,
      growthComment: r.growthComment,
      dividendSustainability: r.dividendSustainability,
      recommendedPosition: r.recommendedPosition,
      watchPoints: r.watchPoints,
    }).where(and(eq(stocks.batchId, batch.id), eq(stocks.code, r.code)))
      .returning({ code: stocks.code, name: stocks.name });
    console.log(result.length > 0 ? `✓ ${result[0].code} ${result[0].name}` : `✗ ${r.code} not found`);
  }
}
main();
```

**ガイド**:
- 前回バッチで同じ銘柄が分析済みの場合、`stocks` から前回の `business`/`tailwinds`/`headwinds` を取得して参照し、変化点（決算・市況・規制）を反映する
- 関税・地政学リスク・規制動向など、財務スコアに現れない外部要因を必ず headwinds に反映する
- 中期経営計画や次回決算日などタイムリーな要素は watchPoints に入れる

### Step 5: Tier S ポートフォリオサマリー生成

Tier S 銘柄全体を俯瞰して、`trade.portfolio_summaries` に1行 INSERT する。

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import { screeningBatches, portfolioSummaries } from "@anydigi-lab/database/schema/trade";

const db = drizzle(neon(process.env.DATABASE_URL!));
const [batch] = await db.select().from(screeningBatches)
  .where(eq(screeningBatches.genre, "jp-high-dividend"))
  .orderBy(desc(screeningBatches.createdAt)).limit(1);

await db.insert(portfolioSummaries).values({
  batchId: batch.id,
  tier: "S",
  sectorBias: "...",        // セクター偏りの指摘（1文）
  recommendation: "...",    // 分散のための推奨（1文）
  coreCandidates: ["XXXX", "YYYY"],       // recommendedPosition === "core" の銘柄コード
  satelliteCandidates: ["ZZZZ"],          // recommendedPosition === "satellite" の銘柄コード
});
```

### Step 6: 動作確認

```bash
# /trade/jp-high-dividend の表示要素が揃っているか
# - StatCard の数値、StockTable の Tier 分布
# - Tier S 詳細ページの portfolio summary、銘柄ごとの business/tailwinds/...

# 開発サーバー
cd apps/web && pnpm dev
```

http://localhost:3000/trade/jp-high-dividend を開いて Tier S/A の詳細カードが期待通り埋まっているか確認する。

## 注意事項

- スコアリング (Step 1〜2) は決定論的なので、Claude が値を捏造しないこと。`screen-jp-dividend.ts` の出力に従う
- AI生成 (Step 4〜5) は WebSearch 必須。記憶やキャッシュに頼らない
- フロントは `screeningBatches.createdAt DESC` 最新を引くだけなので、バッチを作り直すたびに表示が切り替わる（ロールバックは「古いバッチを物理削除」でなく「新しいバッチを作る」運用）
- `recommendedPosition` は Step 2 で自動分類されるが、財務スコアだけで判断しているので、AI 分析時に外部要因を踏まえて適宜上書きしてよい
- 失格銘柄 (`disqualified=true`) は Tier 分析対象外
