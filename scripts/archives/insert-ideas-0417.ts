import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ideas, ideaEvidence, ideaScores } from "@anydigi-lab/database/schema/insights";
import { generateEmbedding, findSimilarIdeas } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("=== insights 2026-04-17 アイデア書き込み ===\n");

  // === 新規アイデア（embedding重複チェック付き） ===

  const newIdeas = [
    {
      title: "AIコーディングエージェント品質保証・ベンチマークサービス",
      summary:
        "エンタープライズ向けAIコーディングツール（Factory, Codex, Claude Code等）の出力コード品質・セキュリティ・コスト効率を比較ベンチマークし、導入企業に最適なツール選定と品質保証を提供するサービス。",
      category: "anydigi",
      scores: { market: 8, fit: 8, timing: 9, evidence: 6 },
      evidenceArticles: [
        {
          articleId: "298523b2500f2a20e80f788908f32ac627deab383866c7e20a3612fc1deb2910",
          relevanceNote: "Factory $1.5B調達。エンタープライズAIコーディング市場の急成長を示す",
        },
        {
          articleId: "b928c5b64b7940ac305e2208b89cb7b395b2ac100b215baf450f1e8d9590290b",
          relevanceNote: "OpenAI CodexがClaude Codeに対抗し大幅アップデート。ツール間競争激化で品質保証の需要が高まる",
        },
      ],
    },
    {
      title: "ソフトウェアサプライチェーンセキュリティ監査サービス",
      summary:
        "npm/pip等のパッケージマネージャ経由のサプライチェーン攻撃が多発する中、AIエージェントが自動で依存関係を分析し脆弱性を検出する監査サービス。AIエージェント時代のCI/CD自動化に伴う攻撃面拡大に対応。",
      category: "anydigi",
      scores: { market: 7, fit: 7, timing: 8, evidence: 5 },
      evidenceArticles: [
        {
          articleId: "32c960d1772196548dc71482ed2e64e2ff30e4db1ce28ea8e537740feaf3b85f",
          relevanceNote: "Trivy/axiosへのサプライチェーン攻撃事例。npm installが任意コード実行リスクを持つことが広く認知され始めた",
        },
      ],
    },
    {
      title: "AIエージェント可観測性（Observability）プラットフォーム",
      summary:
        "AIエージェントの障害診断に特化した可観測性プラットフォーム。従来のAPM/監視ではAIエージェント特有の障害を捕捉できない。AIスタック全体のトレーサビリティを提供する市場が急成長中。",
      category: "general",
      scores: { market: 8, fit: 5, timing: 9, evidence: 6 },
      evidenceArticles: [
        {
          articleId: "7782629f00fc1bf515a16b4f113d5a4b08d44544da4c9a60de912cd1119cd171",
          relevanceNote: "InsightFinderが$15M調達。AIエージェントの障害診断に特化した可観測性市場の立ち上がりを実証",
        },
      ],
    },
    {
      title: "AI駆動パーソナライズドコマース",
      summary:
        "AI経由のリテールトラフィックがQ1で393%増加し、コンバージョン率も非AIを上回る。AIショッピングアシスタントやAI検索からの流入を最適化するAI-SEO的コマース支援。",
      category: "general",
      scores: { market: 8, fit: 4, timing: 8, evidence: 6 },
      evidenceArticles: [
        {
          articleId: "5413da9db8f123de9531f063dc2524f20d84c009f2023523b5b3badf1a199f8d",
          relevanceNote: "Adobe調査でAIトラフィックがQ1に393%増加、コンバージョン率も高い。AIコマース市場の急成長を示す定量データ",
        },
      ],
    },
  ];

  const insertedIdeas: { title: string; id: number; isNew: boolean }[] = [];

  for (const idea of newIdeas) {
    const embeddingText = `${idea.title}\n${idea.summary}`;
    console.log(`Generating embedding: ${idea.title}`);
    const embedding = await generateEmbedding(embeddingText);

    const similar = await findSimilarIdeas(db, embedding, 0.80);
    if (similar.length > 0) {
      console.log(
        `  → 類似アイデア検出: "${similar[0].title}" (similarity: ${similar[0].similarity.toFixed(3)})`
      );
      console.log(`  → 既存アイデアへのevidence追加として扱います`);
      for (const ev of idea.evidenceArticles) {
        await db.insert(ideaEvidence).values({
          ideaId: similar[0].id,
          articleId: ev.articleId,
          relevanceNote: ev.relevanceNote,
        });
      }
      insertedIdeas.push({ title: idea.title, id: similar[0].id, isNew: false });
      continue;
    }

    const [inserted] = await db
      .insert(ideas)
      .values({
        title: idea.title,
        summary: idea.summary,
        category: idea.category,
        embedding,
        status: "active",
      })
      .returning();
    console.log(`  ✓ 新規アイデア挿入: id=${inserted.id}`);

    for (const ev of idea.evidenceArticles) {
      await db.insert(ideaEvidence).values({
        ideaId: inserted.id,
        articleId: ev.articleId,
        relevanceNote: ev.relevanceNote,
      });
    }

    await db.insert(ideaScores).values({
      ideaId: inserted.id,
      market: idea.scores.market,
      fit: idea.scores.fit,
      timing: idea.scores.timing,
      evidence: idea.scores.evidence,
    });

    insertedIdeas.push({ title: idea.title, id: inserted.id, isNew: true });
  }

  // === 既存アイデアへの証拠追加 ===
  console.log("\n--- 既存アイデアへの証拠追加 ---");

  const existingEvidence = [
    {
      ideaId: 1,
      articleId: "7782629f00fc1bf515a16b4f113d5a4b08d44544da4c9a60de912cd1119cd171",
      relevanceNote: "InsightFinderがAIエージェント障害診断に$15M調達。テスト（予防）と可観測性（検知）は表裏一体で、耐障害性テスト需要を裏付ける",
    },
    {
      ideaId: 1,
      articleId: "b928c5b64b7940ac305e2208b89cb7b395b2ac100b215baf450f1e8d9590290b",
      relevanceNote: "OpenAI Codexがデスクトップ操作まで拡張。攻撃面拡大でエージェントの権限逸脱テスト・サンドボックス検証需要がさらに高まる",
    },
    {
      ideaId: 2,
      articleId: "cbdc9f031685722257c8c015c9832c67cef5b1094e6c758ef750e09fd3e2ae20",
      relevanceNote: "Colab+Geminiの学習モード進化で、非エンジニアがAIツールを学ぶハードルが低下。内製化支援の実現可能性がさらに高まる",
    },
    {
      ideaId: 2,
      articleId: "298523b2500f2a20e80f788908f32ac627deab383866c7e20a3612fc1deb2910",
      relevanceNote: "エンタープライズAIコーディング市場が$1.5B規模に成長。大企業向けツールの高額化が中小企業の伴走型支援需要を生む",
    },
    {
      ideaId: 6,
      articleId: "d385f5137d925a9b36f9f28da0f96f7779ff901a3e98ee6259287855096101ce",
      relevanceNote: "LumaがAI制作スタジオを設立、Prime Videoでモーゼの物語を公開予定。AI動画制作が劇場品質レベルに到達しつつある証拠",
    },
  ];

  for (const ev of existingEvidence) {
    await db.insert(ideaEvidence).values(ev);
    console.log(`  ✓ idea_id=${ev.ideaId} に evidence 追加`);
  }

  // === サマリー ===
  console.log("\n=== 完了 ===");
  for (const i of insertedIdeas) {
    console.log(`  ${i.isNew ? "NEW" : "MERGED"}: ${i.title} (id: ${i.id})`);
  }
  console.log(`  既存アイデアへの証拠追加: ${existingEvidence.length}件`);
}

main().catch(console.error);
