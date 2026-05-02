---
name: needradar-lancers
description: Lancers の案件検索からニーズを抽出して needradar.needs に蓄積する（週次運用）
---

NeedRadar の Lancers 経由ニーズ収集を実行します。

## 前提

- 取得頻度: **週1回**（月曜深夜想定）
- 取得方法: **WebFetch で直接 Lancers の検索ページを叩く**（Functions 化はしない）
- 規約: ClaudeBot として明示許可されている範囲。生データは公開しない（要約済みニーズのみ Neon に保存）
- 詳細は `LANCERS.md` を参照

## Step 1: キーワード選定

中川の強み領域（食品×製造業×現場×レガシー脱却）を最優先で網を張る。

### 食品縦軸（毎回必ず叩く）

| キーワード | URL用エンコード |
|---|---|
| 食品 | `%E9%A3%9F%E5%93%81` |
| 飲食店 | `%E9%A3%B2%E9%A3%9F%E5%BA%97` |
| 食品工場 | `%E9%A3%9F%E5%93%81%E5%B7%A5%E5%A0%B4` |
| HACCP | `HACCP` |
| 食品EC | `%E9%A3%9F%E5%93%81EC` |
| ふるさと納税 | `%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E` |

### 製造業縦軸（毎回必ず叩く）

| キーワード | URL用エンコード |
|---|---|
| 製造業 | `%E8%A3%BD%E9%80%A0%E6%A5%AD` |
| 生産管理 | `%E7%94%9F%E7%94%A3%E7%AE%A1%E7%90%86` |
| 受発注 | `%E5%8F%97%E7%99%BA%E6%B3%A8` |
| トレーサビリティ | `%E3%83%88%E3%83%AC%E3%83%BC%E3%82%B5%E3%83%93%E3%83%AA%E3%83%86%E3%82%A3` |

### 業種横断（週ごとにローテーション、3〜5個）

| キーワード | URL用エンコード |
|---|---|
| 自動化 | `%E8%87%AA%E5%8B%95%E5%8C%96` |
| 業務効率化 | `%E6%A5%AD%E5%8B%99%E5%8A%B9%E7%8E%87%E5%8C%96` |
| Excel | `Excel` |
| LINE | `LINE` |
| 予約管理 | `%E4%BA%88%E7%B4%84%E7%AE%A1%E7%90%86` |
| 在庫管理 | `%E5%9C%A8%E5%BA%AB%E7%AE%A1%E7%90%86` |
| 引き継ぎ | `%E5%BC%95%E3%81%8D%E7%B6%99%E3%81%8E` |
| 補助金 | `%E8%A3%9C%E5%8A%A9%E9%87%91` |
| AIエージェント | `AI%E3%82%A8%E3%83%BC%E3%82%B8%E3%82%A7%E3%83%B3%E3%83%88` |
| 卸売 | `%E5%8D%B8%E5%A3%B2` |
| 地方創生 | `%E5%9C%B0%E6%96%B9%E5%89%B5%E7%94%9F` |

## Step 2: WebFetch で取得

各キーワードについて、以下の URL を WebFetch で叩く:

```
https://www.lancers.jp/work/search?keyword={URL_ENCODED_KEYWORD}
```

WebFetch の prompt（共通テンプレート）:

> 案件一覧を上から30件、それぞれ「タイトル / カテゴリ / 予算 / 困りごと・求めるアウトプット要約（30〜80文字、業務内容や現場課題が分かるように）」で列挙してください。広告・データ収集タスクの汎用案件は除外。発注者の業務に固有の課題が見える案件を優先。

**注意:**
- キーワード間は最低5秒空ける（Lancers robots.txt の ClaudeBot 準拠）
- 1回の取得で 食品6 + 製造業4 + 横断3〜5 = **13〜15キーワード × 30件 = 約400〜450件** を取得
- ログイン要求や bot 検知が出た場合は中止して報告

## Step 3: ニーズ抽出

取得した全案件を横断的に読み解き、**同じ困りごと・構造的課題が複数案件で繰り返し出ているもの**をニーズ化する。

**採用基準:**
- 同じパターン（業務名・ツール名・KPI名）が複数案件で出現
- 中川の強み領域（食品×製造業×現場×レガシー脱却）で対応可能
- 「金が動いている＝発注予算が見える」ことで強度が定量化される
- AnyDigi の検証チャネル（父の会社継承先・元電力会社の現場感）で刺さる

**除外基準:**
- データ収集・入力タスクの汎用案件（5円/件のリスト作成のみ）
- 単発・特殊事例（再現性なし）
- 広告・スパム

**vertical 分類:**
- `food`: 食品・飲食・農業
- `manufacturing`: 製造・工場・現場
- `creative`: 制作・デザイン
- `business`: 業種横断のビジネス課題
- `ai`: AI開発・AI導入関連
- `general`: その他

## Step 4: 既存ニーズの確認

`mcp__neon__query` で現在の `needradar.needs` を全件取得して把握する。

```sql
SELECT id, title, vertical, evidence_count, sources, created_at
FROM needradar.needs
WHERE status = 'active'
ORDER BY evidence_count DESC
```

## Step 5: 結果を表示

```
## 新規ニーズ

### [ニーズタイトル]
- **要約:** [1-2文]
- **vertical:** food / manufacturing / creative / business / ai / general
- **証拠案件:** [予算] "[案件タイトル抜粋]" (keyword: 食品 等)
- **証拠案件:** ...

## 既存ニーズへの証拠追加

### [既存ニーズタイトル]（id: X, 現在 evidence_count: Y）
- **証拠案件:** [予算] "[案件タイトル抜粋]" (keyword: 受発注 等)

## スキップ
- [スキップ理由を一言]
```

## Step 6: Neon に書き込む

TypeScript スクリプトを生成して実行する。

スクリプトの構造:
1. `generateEmbedding(title + "\n" + summary)` で各新規ニーズの embedding 生成
2. `findSimilarNeeds(db, embedding, 0.80)` で既存ニーズと照合
   - 類似あり → evidence_count++, sources 更新（重複追加しない）, regions 更新（重複追加しない）
   - 類似なし → INSERT（embedding, regions も一緒に保存）
3. 既存ニーズへの証拠追加は evidence_count++, sources 更新, regions 更新のみ

スクリプトのファイル名: `scripts/needradar-collect-lancers-YYYY-MM-DD.ts`

`sources` の命名規則: `lancers/{キーワード}` 形式で記録（複数キーワードでヒットした場合は配列にマージ）

`regions` は `["JP"]` 固定（Lancersは日本のみ）

使用するインポート:

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";
```

## Step 7: サマリー表示

```
## needradar-lancers 実行完了（YYYY-MM-DD）

- 取得キーワード数: X個
- 取得案件数: 約X件
- 新規ニーズ: X件
- 証拠追加（既存）: X件
- スキップ: X件
- アクティブニーズ総数: X件
```

## Step 8: 成功時のアーカイブ

サマリー表示まで成功した場合のみ、本実行で `scripts/` 配下に生成したスクリプトを `scripts/archives/YYYY-MM/`（YYYY-MM は実行日の年月）へ移動する。

```bash
mkdir -p scripts/archives/YYYY-MM
mv scripts/<本実行で生成したファイル名> scripts/archives/YYYY-MM/
```

- 失敗・中断した場合は移動しない（再実行で内容を確認・修正できるよう残す）
- 複数ファイルを生成した場合は全て移動する
- ディレクトリが既にあれば `mkdir -p` は no-op

## 注意事項

- **生データを公開ページに出さない**（案件本文や URL を NeedRadar 公開ページに掲載しない）
- **抽出は要約・抽象化されたニーズに限定**
- **画像・ロゴは取得しない**
- 案件詳細URL（`/work/detail/{id}`）は取得しても保存しない
- BigQueryは経由せず、抽出結果を直接 Neon に保存（Reddit/YouTubeとは異なる経路）
