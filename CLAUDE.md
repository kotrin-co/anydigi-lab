@AGENTS.md
# AnyDigi Lab

## 要件定義書（詳細）
/Users/kentaronakagawa/Documents/AnyDigi.LLC/development/anydigi-labo/requirements.md

## 要件サマリー

### 背景・目的
AnyDigi合同会社の代表（中川）が運用する個人ツール群とポートフォリオサイトを単一プラットフォームに統合する。
NeedRadar（GCP一式）、AnyTrade（Firebase）、insights（新規）が分散しており、コスト・運用負荷が課題。
Claude Code Maxの定額契約をサーバーサイドAI処理に再利用し、「1人＋AI、稟議ゼロ」のインフラを実現する。

- コスト圧縮: NeedRadar月額 ¥10,000 → ¥1,000以下
- AI推論の集約: Claude Code Max定額枠で完結（Vertex AI Gemini廃止）
- YouTube API ToS遵守: 取得データ30日以内削除を構造的に保証
- ポートフォリオ強化: NeedRadarを「AIアナリストが毎日働く姿を見せる」導線に

### モジュール構成
| モジュール | 概要 | 公開範囲 |
|---|---|---|
| insights | RSSニュース分析・ビジネスアイデアトラッカー（embedding重複排除・継続スコアリング） | 本人のみ |
| trade | 高配当株分析・銘柄観測（旧AnyTradeから移行） | 本人のみ |
| needradar | YouTubeコメント分析 → AIアナリストレポート公開 | 公開 |

### アーキテクチャ（CQRS 4層 + 定義層）
```
収集層: GCP Cloud Functions → BigQuery（一時保管、30日パーティション期限）
分析層: ローカル Mac launchd → Claude Code -p → BQ MCP読み取り → Postgres MCP書き込み
永続層: Neon Postgres（insights.* / trade.* / needradar.*）
定義層: Cube Core（セマンティックレイヤー、ローカル実行、読み取り専用）
表示層: Vercel Next.js 16 App Router（Server Components → Neon読み取り）
別経路: GitHub Actions → 株価API → Neon trade.* 直書き（AI不要処理）
```

### 技術スタック
- フロント: Next.js 16 (App Router, Server Components)
- ホスティング: Vercel Hobby（将来Pro移行想定）
- 認証: Vercel Authentication（insights/tradeのみ、needradarは公開）
- DB: Neon Postgres Free + pgvector + Drizzle ORM
- セマンティックレイヤー: Cube Core（OSS、ローカル実行）
- 書き込み主体: ローカル Claude Code (-p mode) + Postgres MCP
- AI推論: Claude Code Max（定額）
- Embedding: OpenAI text-embedding-3-small
- 一時保管: BigQuery needradar_tmp.*（30日パーティション期限）
- 収集: GCP Cloud Functions + Cloud Scheduler
- スケジューラ: macOS launchd（AI処理）/ GitHub Actions（AI不要処理）
- 監視: Slack Webhook + 翌朝鮮度チェック

### ドメイン
- lab.anydigi.co.jp — /insights/*, /trade/*（認証あり）
- useneedradar.com — /ja/ai-analyses/*（公開）
- 同一Vercelプロジェクトにカスタムドメイン割り当て、middlewareで認証分岐

### 主な制約
- Claude Code Max: 5時間ローリング窓 → 深夜実行で日中を圧迫しない
- Vercel Hobby: Functions 10秒タイムアウト、AI処理はVercel側で行わない
- Neon Free: 0.5GB上限 → 記事本文はNeonに持たない
- BigQueryクエリ: 必ず日付カラムでパーティション絞り込み
- YouTube ToS: 取得データ30日以内削除、コメント本文の長期保存禁止

### MCP利用ガイド
- 「ポートフォリオ」「保有資産」「資産状況」などデータの確認・操作を求められた場合は、コードを読むのではなくMCPツール（get_portfolio, get_portfolio_summary等）で実データを取得すること
- コードの確認が必要な場合はユーザーが「コードを見て」「実装を確認して」等と明示する

### フェーズ計画
- Phase 0: 開発環境整備（リポジトリ、Next.js、Vercel、Neon、Drizzle）
- Phase 1: insights基本機能（スキーマ確定、/morning改修、Vercel表示）
- Phase 2: insights高度化（Embedding重複排除、/rerank、launchd自動実行）
- Phase 3: trade移行（AnyTrade → Neon、Firebase廃止）
- Phase 4: needradar収集層（BigQuery一時保管、Functions リファクタ、Vertex AI廃止）
- Phase 5: needradar分析・表示層（/needradarコマンド、Vercelページ、ドメイン移管）
- Phase 6: 横断機能（insights × trade × needradar）
- Phase 7: needradar拡張（30〜100テーマスケール、定点観測）
