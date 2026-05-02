import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  articles,
  ideas,
  ideaEvidence,
  ideaScores,
} from "@anydigi-lab/database/schema/insights";
import { generateEmbedding, findSimilarIdeas } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "1abac019fd7cbeaa611d7f4cb6b9fe2aa9bc20eca2336bc3e2a2286b31691680", url: "https://techcrunch.com/2026/04/29/amazons-cloud-business-is-surging-and-so-is-its-capital-spending/", title: "Amazon's cloud business is surging — and so is its capital spending", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T00:14:23Z") },
  { id: "6bdfb100de8923cf5b26492b8f3f67b76dbded16f64485aa35b8cc5c165d0a45", url: "https://techcrunch.com/2026/04/29/sources-anthropic-could-raise-a-new-50b-round-at-a-valuation-of-900b/", title: "Sources: Anthropic could raise a new $50B round at a valuation of $900B", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T00:07:15Z") },
  { id: "c2a07d6f2572284f796899bd86e18ae5cab7d388aad2983acac091418a3989e2", url: "https://techcrunch.com/2026/04/29/on-the-stand-elon-musk-cant-escape-his-own-tweets/", title: "On the stand, Elon Musk can't escape his own tweets", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T23:58:36Z") },
  { id: "f5fad6ad530c6a641d2e46d8b559fc27e4368e6218a19da44e1d78d1c9580348", url: "https://techcrunch.com/2026/04/29/meta-is-still-burning-money-on-ar-vr/", title: "Meta is still burning money on AR/VR", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T23:58:26Z") },
  { id: "b5ca8c1cb31d74dd8dd710e59b9bbebc87c5a2506cbff354ab029cb6781dc9d8", url: "https://techcrunch.com/2026/04/29/satya-nadella-says-hes-ready-to-exploit-the-new-openai-deal/", title: "Satya Nadella says he's ready to 'exploit' the new OpenAI deal", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T23:55:23Z") },
  { id: "468641f1ee0b45bc156aa5e1e1e8b70e5f228515dc99fd10589e89b5fda08164", url: "https://techcrunch.com/2026/04/29/microsoft-says-it-has-over-20m-paid-copilot-users-and-they-really-are-using-it/", title: "Microsoft says it has over 20M paid Copilot users, and they really are using it", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T23:02:23Z") },
  { id: "a3bd08e9699e67b939d8a9d979b3acd9730b2c73569ad58ee804670407be1da4", url: "https://techcrunch.com/2026/04/29/google-cloud-surpasses-20b-but-says-growth-was-capacity-constrained/", title: "Google Cloud surpasses $20B but says growth was capacity-constrained", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T22:20:48Z") },
  { id: "b6b3b935c23f57d7b71d69ed8dcb1e5ca87ee78dd821cae2b51a5d5fac57f767", url: "https://kn.itmedia.co.jp/kn/articles/2604/30/news051.html", title: "プレゼン資料も指示を出すだけ？　OpenAI、最新画像生成モデル「Images 2.0」発表", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T22:00:00Z") },
  { id: "f63c3911b947d547fc51f92f29c1793295415ca76e7ba7e9903fa2561a41901d", url: "https://www.itmedia.co.jp/news/articles/2604/11/news002.html", title: "【最終話】漫画「1週間後に生成AIで恥をかく新入社員」", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T22:00:00Z") },
  { id: "1f01bf8aac846311b3db88cbb26491528db550fd2e4cdb2fbe57e386281df995", url: "https://www.itmedia.co.jp/news/articles/2604/30/news063.html", title: "Google、「Gemini」とのチャットから直接PDFやExcelファイルを生成可能に", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T21:56:00Z") },
  { id: "7725a88c27e89fc8b8f7e161471bd50f2ce708a83cc1c3a3e1be3643b8a17204", url: "https://techcrunch.com/2026/04/29/google-gains-25m-subscriptions-in-q1-driven-by-youtube-and-google-one/", title: "Google gains 25M subscriptions in Q1, driven by YouTube and Google One", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T20:59:00Z") },
  { id: "dccf9a330fc317de71e2554753b59e8894f720ab5b591cbd4b9db869b33469d0", url: "https://www.theverge.com/tech/920815/google-alphabet-q1-2026-earnings-sundar-pichai", title: "Google Search queries hit an 'all time high' last quarter", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T20:28:11Z") },
  { id: "f5533046e1fc7ae4bc5d362e309db59112b7836b75594788526436c073d9322d", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200006/", title: "GTC 2026に大量のロボット、通信やデジタルツインにも浸透", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:06:00Z") },
  { id: "8ca76afb792d8588c23f0a87de09489df68ac7f3f1dac913d1db102f85f21123", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200005/", title: "「次のフロンティア」開拓へ、通信がロボにもたらす賢さと速さ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:05:00Z") },
  { id: "40fcd4636565b8438461f1bcfcde2f770d2fd8611846cef7e59bfc30facd4e62", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200004/", title: "中国がハードもソフトも圧倒的に先行、日本はコア部品の技術で巻き返しへ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:04:00Z") },
  { id: "2b6e25dc585b18a8155b7240c7fcc2bb34d79f8f55aecd8b05b953694996b6b8", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200003/", title: "人型ロボ、工場から飛び出しオフィスへ　「人が多い領域」の自動化を目指す", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:03:00Z") },
  { id: "f123f115157bb021d74d50ee4c993ddaa6d88ec23348d7db78639a2026be2a97", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200002/", title: "オープン化で自前主義から脱却も、産業用以外でも人型ロボットは静観", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:02:00Z") },
  { id: "9ea3a5f0c8832979831dd620d041db817a327a0746ff1ee96a51213154ca3400", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00190/042200001/", title: "工場に訪れる自動化の地殻変動、米中と違う3つの勝ち筋", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:01:00Z") },
  { id: "832fa3043f46003c97584c847df18c003e005f1bb622a11662127f8d1fa8524b", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00012/00388/", title: "デンソー「インドの需給逼迫」など　車部品15社、中国レアアース規制の影響", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "4fd8ac607a06dddf2c32eba0d083a66d9a928e70a0a6e2f4f764da7761574890", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00011/00354/", title: "高専生に伝える技術者の「生きざま」、日立や川崎重工らのエンジニアが登壇", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "fe819d181fed6cb38fe7512d7c4ad3c77056d85b457007a92de7f7b6ff0dd711", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00166/00004/", title: "新規事業開発に生成AI「利用」6割、「テーマ探索・アイデア創出」で", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "d994f58a70505fd968e4d6a3c4f503db53797a79f11f4feb9ef518faab05abb4", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00019/00099/", title: "中国メーカーに対抗するには", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "c4d110bca9496775eaa28438d92967de3d6f90d5f60c17881077d6281a80e297", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00008/00103/", title: "金型無償保管の理解が進んだ　ほか", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "aff0f499afe3db622f140eaede32eb44dbf838112bbc3d5f8b70a59efd9f4ff4", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00011/00353/", title: "三菱電機も出資するユニコーン予備軍　東大発新興の燈、フィジカルAI 「26年内に」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "eac462ee0ccd31be387df75b9cce52fd613d58e4a6b6d0920ab786e82260c582", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00011/00351/", title: "日系車部品の失注相次ぐ「bZショック」、トヨタや日産で中国部品が急拡大", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "364c4682452284a844db35a78f512c48b08faeda2758b19cbc4644987c3d5044", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00016/00081/", title: "偶然の連鎖と判断ミスが死亡事故に、ENEOS堺製油所の硫化水素ガス漏洩", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "127c46a0f48918888115d1833532c3014e774bd13f40a70961db491fff9e3cad", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00014/00092/", title: "基本中の基本から工場を学ぶ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "6800fb592d420b9c86c5dba8689ef752a6736299c896746a559194fb09d50bd5", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00011/00352/", title: "不良率の予測AIで「鋳込み」の技を伝授　黒野金属、LLMで定性データも活用", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
  { id: "0568e6104abd5a0f70c0a04c2b884ae7aebac0d004ad77b324a89de3adb091ba", url: "https://xtech.nikkei.com/atcl/nxt/mag/nmc/18/00168/00013/", title: "こんな物資が入手困難に、イラン攻撃で供給網に影響", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-29T20:00:00Z") },
];

async function main() {
  // === Step 2: 記事同期 ===
  console.log("Step 2: Inserting articles...");
  for (const a of bqArticles) {
    await db.insert(articles).values(a).onConflictDoNothing();
  }
  console.log(`✓ ${bqArticles.length} articles synced`);

  // === Step 3: アイデア抽出 ===
  console.log("\nStep 3: Extracting ideas...");

  // --- 新規アイデア1: 製造業向け技能継承AI (general) ---
  const newIdea1Title = "製造業向け技能継承AI（熟練工の暗黙知×LLM不良率予測）";
  const newIdea1Summary = "黒野金属のように熟練工が言語化してきた感覚・経験をLLMで構造化し不良率予測モデルを構築するサービス。少子高齢化で切迫する中小製造業の技能継承問題を、定性データ+LLM+予測AIで解く。設備導入ではなく「人の知識のデジタル化」を起点とするため、中小製造業でも段階的に実装できる。";

  console.log(`\nChecking similarity for: ${newIdea1Title}`);
  const emb1 = await generateEmbedding(`${newIdea1Title}\n${newIdea1Summary}`);
  const similar1 = await findSimilarIdeas(db, emb1, 0.80);

  let newIdea1Id: number | null = null;
  if (similar1.length > 0) {
    console.log(`  → Similar to existing: ${similar1[0].title} (similarity: ${similar1[0].similarity.toFixed(3)})`);
    console.log(`  → Adding as evidence to idea ${similar1[0].id}`);
  } else {
    console.log("  → No similar ideas found, inserting as new");
    const [inserted] = await db.insert(ideas).values({
      title: newIdea1Title,
      summary: newIdea1Summary,
      category: "general",
      embedding: emb1,
      status: "active",
    }).returning();
    newIdea1Id = inserted.id;
    console.log(`  ✓ New idea id: ${newIdea1Id}`);
  }

  // --- 新規アイデア2: 製造業向け地政学リスク早期警戒・代替調達AI (general) ---
  const newIdea2Title = "製造業向け地政学リスク早期警戒・代替調達AIサービス";
  const newIdea2Summary = "中国レアアース輸出規制・イラン情勢・中国EV攻勢が同時多発する今、調達担当者がバラバラに対応する現状をAI自動モニタリングで解決する。地政学リスクの影響度評価・影響受けるサプライヤーの特定・代替調達候補の提示を一元化。自動車部品・電子部品・素材メーカーの調達部門が主要ターゲット。";

  console.log(`\nChecking similarity for: ${newIdea2Title}`);
  const emb2 = await generateEmbedding(`${newIdea2Title}\n${newIdea2Summary}`);
  const similar2 = await findSimilarIdeas(db, emb2, 0.80);

  let newIdea2Id: number | null = null;
  if (similar2.length > 0) {
    console.log(`  → Similar to existing: ${similar2[0].title} (similarity: ${similar2[0].similarity.toFixed(3)})`);
    console.log(`  → Adding as evidence to idea ${similar2[0].id}`);
  } else {
    console.log("  → No similar ideas found, inserting as new");
    const [inserted] = await db.insert(ideas).values({
      title: newIdea2Title,
      summary: newIdea2Summary,
      category: "general",
      embedding: emb2,
      status: "active",
    }).returning();
    newIdea2Id = inserted.id;
    console.log(`  ✓ New idea id: ${newIdea2Id}`);
  }

  // === Step 4: Evidence & Scores ===
  console.log("\nStep 4: Linking evidence...");

  const evidenceRecords: { ideaId: number; articleId: string; relevanceNote: string }[] = [];

  // 新規アイデア1（技能継承AI）のevidence
  const idea1Target = newIdea1Id ?? similar1[0]?.id;
  if (idea1Target) {
    evidenceRecords.push(
      { ideaId: idea1Target, articleId: "6800fb592d420b9c86c5dba8689ef752a6736299c896746a559194fb09d50bd5", relevanceNote: "黒野金属がLLMで定性データを活用した不良率予測AIを実装。鋳造職人の感覚・観察をLLMで構造化し数値予測に変換。中小製造業での実用例として技能継承AI市場を裏付ける" },
    );
  }

  // 新規アイデア2（地政学リスク調達AI）のevidence
  const idea2Target = newIdea2Id ?? similar2[0]?.id;
  if (idea2Target) {
    evidenceRecords.push(
      { ideaId: idea2Target, articleId: "832fa3043f46003c97584c847df18c003e005f1bb622a11662127f8d1fa8524b", relevanceNote: "デンソー等15社が中国レアアース輸出規制の影響を受け「インドの需給逼迫」等が発生。調達リスクが業界横断で顕在化" },
      { ideaId: idea2Target, articleId: "0568e6104abd5a0f70c0a04c2b884ae7aebac0d004ad77b324a89de3adb091ba", relevanceNote: "イラン攻撃で供給網が混乱、調達部門への問い合わせが殺到する現場を報告。地政学リスク対応の手動作業コストが浮き彫り" },
      { ideaId: idea2Target, articleId: "eac462ee0ccd31be387df75b9cce52fd613d58e4a6b6d0920ab786e82260c582", relevanceNote: "日系車部品がトヨタ・日産の中国調達に失注。bZショックとして日本製造業の調達構造が根底から揺らいでいる" },
    );
  }

  // id:2 中小企業向けAI導入支援
  evidenceRecords.push(
    { ideaId: 2, articleId: "fe819d181fed6cb38fe7512d7c4ad3c77056d85b457007a92de7f7b6ff0dd711", relevanceNote: "日経ものづくりNEWS読者調査で新規事業AI利用が6割に到達。テーマ探索・アイデア創出領域での活用が主流。中小製造業でのAI導入需要を定量的に裏付け" },
  );

  // id:7 LLM Wikiナレッジ基盤
  evidenceRecords.push(
    { ideaId: 7, articleId: "6800fb592d420b9c86c5dba8689ef752a6736299c896746a559194fb09d50bd5", relevanceNote: "黒野金属がLLMで職人の定性知識を構造化して不良率予測に活用。製造業での暗黙知デジタル化がLLMナレッジ基盤の典型ユースケースとして実証された" },
  );

  // id:8 製造業向けマルチモーダルAI図面解析
  evidenceRecords.push(
    { ideaId: 8, articleId: "9ea3a5f0c8832979831dd620d041db817a327a0746ff1ee96a51213154ca3400", relevanceNote: "日経XTechがフィジカルAI特集を展開。工場DXへのAI投資加速が業界横断で確認され、製造現場のAI活用ニーズが決定的に高まっている" },
  );

  // id:15 機密データ向けローカルLLM
  evidenceRecords.push(
    { ideaId: 15, articleId: "a3bd08e9699e67b939d8a9d979b3acd9730b2c73569ad58ee804670407be1da4", relevanceNote: "Google Cloudが$20B超でも需要に供給が追いつかず容量制約を明言。クラウドAIが構造的に逼迫する中、機密データをクラウドに出せない顧客のローカルLLM需要が一層加速" },
  );

  // id:16 物理世界AI訓練データ収集PF
  evidenceRecords.push(
    { ideaId: 16, articleId: "f5533046e1fc7ae4bc5d362e309db59112b7836b75594788526436c073d9322d", relevanceNote: "GTC2026でNVIDIAを中心にロボット・自動運転・医療ロボットへのフィジカルAI展開が確認。World Models実用化に向けた物理訓練データの収集・管理基盤需要が具体化" },
    { ideaId: 16, articleId: "aff0f499afe3db622f140eaede32eb44dbf838112bbc3d5f8b70a59efd9f4ff4", relevanceNote: "東大発スタートアップ燈が三菱電機から50億円調達し評価額1000億円超。フィジカルAI国内市場が本格投資フェーズに入ったことを示す" },
  );

  // id:17 エンタープライズAIエージェント統合・ガバナンス
  evidenceRecords.push(
    { ideaId: 17, articleId: "1abac019fd7cbeaa611d7f4cb6b9fe2aa9bc20eca2336bc3e2a2286b31691680", relevanceNote: "AWSが好業績でも資本支出が急増、AI容量は引き続き逼迫。クラウドAIが有限リソースとなる中、エージェント毎の優先度付け・ガバナンス設計の必要性が増す" },
    { ideaId: 17, articleId: "468641f1ee0b45bc156aa5e1e1e8b70e5f228515dc99fd10589e89b5fda08164", relevanceNote: "Microsoft Copilotが有料ユーザー2000万人超に到達。AI生産性ツールの組織導入が本格化し、複数AIエージェントの統合ガバナンスが企業課題として浮上" },
  );

  if (evidenceRecords.length > 0) {
    await db.insert(ideaEvidence).values(evidenceRecords);
    console.log(`✓ ${evidenceRecords.length} evidence records inserted`);
  }

  // 新規アイデアの初期スコア
  const newScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [];
  if (newIdea1Id) {
    newScores.push({ ideaId: newIdea1Id, market: 8, fit: 5, timing: 9, evidence: 3 });
  }
  if (newIdea2Id) {
    newScores.push({ ideaId: newIdea2Id, market: 7, fit: 5, timing: 9, evidence: 3 });
  }
  if (newScores.length > 0) {
    await db.insert(ideaScores).values(newScores);
    console.log(`✓ ${newScores.length} new idea scores inserted`);
  }

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — 変化なし。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — AI新規事業60%記事でevidence+1。中小製造業AI実運用の定量データ追加
    { ideaId: 2, market: 7, fit: 8, timing: 8, evidence: 9 },
    // id:3 AI審査モデル構築 — 変化なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — 変化なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — 変化なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — 変化なし
    { ideaId: 6, market: 7, fit: 3, timing: 9, evidence: 7 },
    // id:7 LLM Wikiナレッジ基盤 — 黒野金属LLM活用でevidence+1。製造業ナレッジ化実例が裏付けを強化
    { ideaId: 7, market: 7, fit: 8, timing: 7, evidence: 5 },
    // id:8 製造業向けAI図面解析 — フィジカルAI特集でtiming+1
    { ideaId: 8, market: 6, fit: 4, timing: 8, evidence: 7 },
    // id:9 MCPコネクタ構築 — Anthropic $900B評価でClaudeエコシステム拡大が加速確定
    { ideaId: 9, market: 8, fit: 9, timing: 10, evidence: 9 },
    // id:10 AIコーディング品質保証 — Microsoft Copilot 2000万人でAIコーディング大衆化確認
    { ideaId: 10, market: 9, fit: 8, timing: 10, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — 変化なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — 変化なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — Google Search最高値でAI流入強化が継続確認
    { ideaId: 13, market: 8, fit: 4, timing: 8, evidence: 5 },
    // id:14 人間認証インフラ — 変化なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — Google Cloud容量制約でtiming+1、evidence+1
    { ideaId: 15, market: 7, fit: 8, timing: 10, evidence: 8 },
    // id:16 物理世界AI訓練データ収集 — GTC2026+燈でevidence+2、timing+1
    { ideaId: 16, market: 9, fit: 3, timing: 9, evidence: 8 },
    // id:17 エンタープライズAIエージェント統合 — AWS/Google逼迫+Copilot大衆化でevidence+2
    { ideaId: 17, market: 9, fit: 9, timing: 10, evidence: 10 },
    // id:18 クリエイティブ業務AIコネクタ — 変化なし
    { ideaId: 18, market: 7, fit: 7, timing: 8, evidence: 5 },
    // id:19 クリエイター模倣対策 — 変化なし
    { ideaId: 19, market: 7, fit: 4, timing: 8, evidence: 3 },
  ];

  // 新規アイデアも rerank に含める
  if (newIdea1Id) {
    rerankScores.push({ ideaId: newIdea1Id, market: 8, fit: 5, timing: 9, evidence: 3 });
  }
  if (newIdea2Id) {
    rerankScores.push({ ideaId: newIdea2Id, market: 7, fit: 5, timing: 9, evidence: 3 });
  }

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
