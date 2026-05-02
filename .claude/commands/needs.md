---
name: needs
description: needradar-reddit と needradar-youtube を順次実行する日次まとめコマンド
---

NeedRadar の日次ニーズ収集（Reddit + YouTube）をまとめて実行します。

## 実行順序

`reddit` → `youtube` の順で実行する。理由は (1) Reddit は件数が少なく早く終わる、(2) YouTube はコメント上位 5,000 件を扱うので時間がかかる、(3) 両者で同じ `needradar.needs` テーブルに書き込むため、Reddit 側で先に新規ニーズを作っておくと YouTube 側が embedding 類似度で既存ニーズに寄せやすい。

## Step 1: needradar-reddit を実行

`.claude/commands/needradar-reddit.md` の手順を **そのまま全部** 実行する（Step 1〜6）。

完了後、生成された下記をこの会話コンテキストに保持する:
- 実行した TypeScript スクリプトのパス
- 新規ニーズ数 / 証拠追加数 / アクティブニーズ総数
- 抽出されたニーズタイトル一覧

## Step 2: needradar-youtube を実行

`.claude/commands/needradar-youtube.md` の手順を **そのまま全部** 実行する（Step 1〜6）。

Step 1 の結果（特に Reddit で新規作成されたニーズ一覧）を Step 3 の「既存ニーズの確認」時に Neon から取得する `needradar.needs` に含めて見えるので、改めて Reddit 側のニーズと突合して **重複を避ける**。

## Step 3: まとめサマリー

両方の実行が終わったら、下記を表示する:

```
## NeedRadar 日次収集 完了（YYYY-MM-DD）

### Reddit
- 取得投稿数: X 件
- 新規ニーズ: X 件
- 証拠追加: X 件

### YouTube
- 取得コメント数: X 件
- 新規ニーズ: X 件
- 証拠追加: X 件

### 合計
- 新規ニーズ: X 件
- 証拠追加: X 件
- アクティブニーズ総数: X 件（Step 2 完了時点）
```

## 注意

- 片方が 0 件・エラーで終わっても、もう片方は実行する
- どちらかでスクリプト実行に失敗したら、エラー内容を表示してから次に進む（途中で止めない）
- 全件 0 件だった場合のみ「本日は対象データがありませんでした」と表示して終了
