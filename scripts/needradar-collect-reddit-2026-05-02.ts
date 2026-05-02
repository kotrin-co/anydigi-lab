import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: Reddit posts snapshot_date=2026-04-30
// Categories analyzed: food / ai / startup / business / japan
// Food vertical prioritized per user's father-company inheritance focus

const newNeeds = [
  // food
  {
    title: "小規模飲食店の事業計画作成支援需要が継続的に発生",
    summary:
      "米国r/Restauranteurで投資家向け事業計画書の作成相談が繰り返し投稿されている（NYでの20年経験者が地方都市で開業計画、家族経営者が初期投資者向けプラン作成を支援要請等）。MBA系コンサルではなく、現場の言葉で書ける伴走者への需要。AIで雛形→専門家レビューのハイブリッドモデルに余地。",
    vertical: "food",
    sources: [
      "https://reddit.com/r/Restauranteur/comments/eacyal/help_writing_restaurant_business_plan/",
    ],
    regions: ["US"],
  },
  {
    title: "個人飲食店のPOS/オンライン注文システム選定が慢性的な悩み",
    summary:
      "Toast/Jolt/MobileBytes/ChowNow/Square等のレート交渉、移行先選定、旧POS資産の処分などの相談がr/Restauranteurに常時投稿。手数料20k/月規模で数%の差が大きい。中小飲食向けのベンダー比較・乗り換え支援サービスに継続需要。",
    vertical: "food",
    sources: [
      "https://reddit.com/r/Restauranteur/comments/bn095k/restaurants_that_use_toast_how_did_you_lower_your/",
      "https://reddit.com/r/Restauranteur/comments/caqoxj/has_anyone_used_jolt_systems/",
      "https://reddit.com/r/Restauranteur/comments/ds4lwg/mobilebytes_inquiry/",
      "https://reddit.com/r/Restauranteur/comments/fdc5it/online_ordering_systems_chownow_and_others/",
    ],
    regions: ["US"],
  },
  {
    title: "フードデリバリーアプリの高手数料が小規模飲食店の収益を圧迫",
    summary:
      "DoorDash/GrubHubの手数料が利益を侵食しているとの不満投稿が継続。ChowNow等の独立オンライン注文への乗り換えやcloud kitchen化を模索する声。小規模事業者向けに自社注文導線（LINE/Web）を構築する伴走サービスに需要。",
    vertical: "food",
    sources: [
      "https://reddit.com/r/Restauranteur/comments/9wlu1d/how_food_delivery_apps_are_killing_your/",
      "https://reddit.com/r/Restauranteur/comments/fdc5it/online_ordering_systems_chownow_and_others/",
    ],
    regions: ["US"],
  },
  // ai
  {
    title: "AI推論コストが人件費を上回り企業導入の経済性が逆転",
    summary:
      "Nvidia VP Bryan Catanzaroが「コンピュートコストは従業員コストを大きく上回る」と公言、レイオフが進む一方でAI置換が経済合理性を失い始めている矛盾。AIコスト最適化（モデル選定・キャッシュ・量子化）コンサルやFinOps for AIに新需要。",
    vertical: "ai",
    sources: [
      "https://reddit.com/r/artificial/comments/1syp2jz/the_cost_of_compute_is_far_beyond_the_costs_of/",
    ],
    regions: ["US"],
  },
  {
    title: "AI生産性向上の利益が労働者に還元されず雇用消失だけが顕在化",
    summary:
      "「3人分の仕事を1人で出来るようになった結果、2人解雇・残った1人にプレッシャー集中・節約分は上層へ」というAI導入パターンへの強い疑問。1日4時間労働への構造改革やAIROI再分配のフレームワーク提案に余地。",
    vertical: "ai",
    sources: [
      "https://reddit.com/r/artificial/comments/1swxt51/if_ai_makes_everyone_more_productive_why_does_it/",
    ],
    regions: ["US"],
  },
  {
    title: "MLリサーチ情報過多で個人研究者が追跡不能",
    summary:
      "arxiv cs.LGだけで毎日100-200本、cs.AI/math.OC含めるとさらに多く、研究者が個人で追跡不可能と告白。論文要約Slack botやsemantic mapを使うが追いつかない。Claude等LLMで自分の関心軸でキュレーションする個人向けサービスに需要。",
    vertical: "ai",
    sources: [
      "https://reddit.com/r/MachineLearning/comments/1sqi69n/d_it_seems_that_every_day_there_are_around_100/",
      "https://reddit.com/r/MachineLearning/comments/1sz14mi/an_interactive_semantic_map_of_the_latest_10/",
    ],
    regions: ["US"],
  },
  {
    title: "AIデータセンターの電力需要が地域住民の生活コストに転嫁",
    summary:
      "Utah州Box Elder郡で40,000エーカーのhyperscale計画、州全体を上回る発電・消費を予定。電気料金上昇分を望まない住民が負担する構造への怒りが噴出。地域住民向けエネルギー使用権訴訟・規制ロビーや、再エネ自家発電マッチングに新規ビジネス余地。",
    vertical: "general",
    sources: [
      "https://reddit.com/r/artificial/comments/1swuua3/hyperscale_data_center_project_in_utah_expected/",
    ],
    regions: ["US"],
  },
  // startup
  {
    title: "AI/n8n自動化エージェンシーは差別化困難で2年で成長停滞",
    summary:
      "フランスでn8n-firstを2年運営したエージェンシーが商品化の難しさを理由にパートナーに株式譲渡し撤退。「初期は伸びるが中盤で頭打ち、繰り返し顧客が獲得できない」というpost-mortem。テンプレート化＋業種特化のエージェンシー設計に勝ち筋がある。",
    vertical: "startup",
    sources: [
      "https://reddit.com/r/startups/comments/1syrmkm/i_built_an_n8nfirst_automationai_agency_great/",
    ],
    regions: ["EU"],
  },
  // business
  {
    title: "営業職が個人WhatsApp/SMSで顧客対応する非公式運用が常態化",
    summary:
      "公式CRMはミルストーンだけ記録、実際の交渉・クロージングは個人の電話・WhatsAppで実施するパターンが普通になっている。会社資産化されない一方、コンプライアンス上のリスク。RevOpsから見えない正規ルート整備（パーソナル番号で会社管理可能なWhatsApp Businessラッパ等）に需要。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/sales/comments/1sys1wn/i_conduct_90_of_my_highticket_pipeline_completely/",
    ],
    regions: ["US"],
  },
  {
    title: "中小企業のSalesforce契約が15人規模で経済合理性を失う",
    summary:
      "5人時代にstartup dealで契約→15人になって更新時に大幅値上がり、機能の半分も使っていないが移行が怖い。データ・カスタムフィールド・ワークフローの密結合がロックイン。Salesforce→HubSpot/Attioへの移行支援パッケージに継続需要。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/smallbusiness/comments/1szbjvi/salesforce_bill_is_killing_us_at_15_employees/",
    ],
    regions: ["US"],
  },
  {
    title: "中小事業者のSNS投稿運用が日曜を丸ごと奪い続ける",
    summary:
      "Etsy手作りジュエリー店主が毎週日曜にIG投稿の写真撮影・編集・キャプション・ハッシュタグ作成で1日消費、燃え尽き寸前。プロ写真家やマーケッタ雇用は年12,000ユーロでオーバーコスト。中小ECブランド向けのAI支援投稿パイプライン（撮影テンプレ＋自動編集＋キャプション）の余地。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/smallbusiness/comments/1szehzp/how_do_you_handle_social_media_for_your_small/",
    ],
    regions: ["EU"],
  },
  {
    title: "営業職の社内会議が週8時間超で実営業時間を圧迫",
    summary:
      "Fortune 50に移った営業AEが、SMB時代と比べて社内会議が8.5時間/週まで膨張。Pipeline/Forecast、Team huddle、Marketing/Productミーティングで時間が分断されプロスペクティングが進まない。AI議事録＋非同期化で会議削減のコンサル・SaaSに需要。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/sales/comments/1sybvkl/how_many_hours_do_you_spend_a_week_in_internal/",
    ],
    regions: ["US"],
  },
  // japan
  {
    title: "日本の孤独死が年77,000件規模で対応サービス不足",
    summary:
      "2025年に77,000人が自宅で孤独死。規模拡大が報じられているが地域コミュニティや見守りサービスが追いついていない。低コストIoT見守り、自治体連携の安否確認サブスク、孤独死後の遺品整理・特殊清掃マッチングに需要。",
    vertical: "general",
    sources: [
      "https://reddit.com/r/japan/comments/1snvh9w/some_77000_people_found_dead_alone_in_their_homes/",
    ],
    regions: ["JP"],
  },
  {
    title: "日本の看護師85%が離職希望で地方医療の人員危機",
    summary:
      "岩手県看護労組調査で997人中85%が離職希望、肉体的・精神的限界の声。地方医療崩壊の入口。AI問診・AIナーシング業務支援（記録・申し送り）、単発勤務マッチング、定着支援メンタリングに余地。",
    vertical: "general",
    sources: [
      "https://reddit.com/r/japan/comments/1szl8r2/85_of_nurses_in_japans_iwate_pref_want_to_quit_as/",
    ],
    regions: ["JP"],
  },
  {
    title: "地方自治体の「賢い縮小」が公共施設83件廃止など全国モデル化",
    summary:
      "岡山県美咲町が83の公共施設を廃止、住民自治導入で行政コストを圧縮。同様の縮小モデルを他自治体が追随する余地が大きい。施設廃止の合意形成支援、住民自治運営SaaS、廃止施設の民間転用マッチングに需要。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/japan/comments/1sxzaz7/depopulating_aging_west_japan_town_undergoes/",
    ],
    regions: ["JP"],
  },
  {
    title: "地方自治体の少子化対策補助金がマッチングアプリ補助に流れる",
    summary:
      "地方自治体が少子化対策の最新策としてマッチングアプリ利用補助を導入。国費・自治体予算が動き出しており、地域特化マッチングアプリ構築・運用の代行需要。地方創生×婚活の縦軸はLancersでも案件多発、補助金SIと組み合わせて受注機会。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/japan/comments/1sscjmn/subsidies_for_dating_apps_latest_tactic_to_battle/",
    ],
    regions: ["JP"],
  },
  {
    title: "原油高騰で日本企業40%が中核事業縮小を半年内に検討",
    summary:
      "Iran戦争由来の原油高騰で日本企業の40%が6ヶ月以内に中核事業を縮小する可能性。製造業の体力低下が顕在化。エネルギーコスト削減診断・補助金活用支援・原料代替調達コンサルに緊急需要。",
    vertical: "manufacturing",
    sources: [
      "https://reddit.com/r/japan/comments/1sxad5z/oil_surge_may_force_40_of_japans_firms_to_cut/",
    ],
    regions: ["JP"],
  },
];

// 既存ニーズへの証拠追加（id 直接指定）
const evidenceAdditions: {
  id: number;
  addSources: string[];
  addRegions: string[];
  note: string;
}[] = [
  {
    id: 12,
    addSources: [
      "https://reddit.com/r/sales/comments/1stsc73/outreach_is_dead/",
      "https://reddit.com/r/sales/comments/1ssf23l/marketing_just_nuked_hundreds_of_hours_of_work/",
    ],
    addRegions: ["US"],
    note: 'r/sales 325pt "Outreach is dead" + 176pt "Marketing nuked deals"',
  },
  {
    id: 13,
    addSources: [
      "https://reddit.com/r/Entrepreneur/comments/1ssc6q7/took_me_4_years_to_realize_we_were_just_renting/",
    ],
    addRegions: ["US"],
    note: 'r/Entrepreneur 54pt "renting our own business data back from SaaS vendors"',
  },
  {
    id: 15,
    addSources: [
      "https://reddit.com/r/sales/comments/1szha8w/the_buying_process_is_drastically_changing/",
    ],
    addRegions: ["US"],
    note: 'r/sales 61pt "The buying process is drastically changing"',
  },
  {
    id: 16,
    addSources: [
      "https://reddit.com/r/startups/comments/1swsldj/what_ive_learned_watching_nontechnical_founders/",
    ],
    addRegions: ["US"],
    note: 'r/startups 68pt "non-technical founders build with AI"',
  },
  {
    id: 17,
    addSources: [
      "https://reddit.com/r/smallbusiness/comments/1sz8vok/sick_of_eating_the_cost_of_truck_stock_how_are/",
    ],
    addRegions: ["US"],
    note: 'r/smallbusiness 28pt "Sick of eating the cost of truck stock" (HVAC現場小物部材の請求漏れ)',
  },
  {
    id: 18,
    addSources: [
      "https://reddit.com/r/smallbusiness/comments/1sz01v7/am_i_being_unreasonable_or_all_this/",
    ],
    addRegions: ["EU"],
    note: 'r/smallbusiness 75pt "all this influencer/content creator world has gone insane"',
  },
  {
    id: 19,
    addSources: [
      "https://reddit.com/r/LocalLLaMA/comments/1sxqa2c/im_done_with_using_local_llms_for_coding/",
      "https://reddit.com/r/LocalLLaMA/comments/1szajgm/devs_using_qwen_27b_seriously_whats_your_take/",
    ],
    addRegions: ["US"],
    note: 'r/LocalLLaMA 927pt "I\'m done with local LLMs for coding" + 196pt "Devs using Qwen 27B"',
  },
  {
    id: 20,
    addSources: [
      "https://reddit.com/r/artificial/comments/1swqczz/in_10_minutes_with_ai_i_just_got_more_closure_on/",
    ],
    addRegions: ["US"],
    note: 'r/artificial 216pt "10 Minutes with AI got more closure than 4 years of therapy"',
  },
  {
    id: 21,
    addSources: [
      "https://reddit.com/r/japanlife/comments/1sw3yga/how_are_you_guys_affording_trips_back_home_lately/",
    ],
    addRegions: ["JP"],
    note: 'r/japanlife 291pt "How are you guys affording trips back home (weak yen)"',
  },
  {
    id: 22,
    addSources: [
      "https://reddit.com/r/japanlife/comments/1suns5h/people_are_going_to_get_caught_off_guard_by_these/",
      "https://reddit.com/r/japan/comments/1syo1nl/japan_considers_making_language_programs_a_factor/",
    ],
    addRegions: ["JP"],
    note: 'r/japanlife 291pt "language requirements caught off guard" + r/japan 144pt "language programs as residency screening"',
  },
  {
    id: 56,
    addSources: [
      "https://reddit.com/r/japan/comments/1sjx22h/as_school_absentees_increase_japanese_dads_turn/",
    ],
    addRegions: ["JP"],
    note: 'r/japan 296pt "Japanese dads turn to izakaya support group" — 既存ニーズの完全一致証拠',
  },
  {
    id: 57,
    addSources: [
      "https://reddit.com/r/MachineLearning/comments/1suguuz/research_taste_is_a_skill_nobody_talks_about_how/",
    ],
    addRegions: ["US"],
    note: 'r/MachineLearning 90pt "Research taste is a skill nobody talks about"',
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  // 1) 新規候補: similarity 0.80 で既存と照合
  for (const need of newNeeds) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.8);

    if (similar.length > 0) {
      const existing = similar[0];
      const existingSources: string[] = existing.sources ?? [];
      const existingRegions: string[] = (existing as any).regions ?? [];
      const mergedSources = Array.from(new Set([...existingSources, ...need.sources]));
      const mergedRegions = Array.from(new Set([...existingRegions, ...(need.regions ?? [])]));
      const srcArr = sql`ARRAY[${sql.join(mergedSources.map((v) => sql`${v}`), sql`,`)}]::text[]`;
      const regArr = sql`ARRAY[${sql.join(mergedRegions.map((v) => sql`${v}`), sql`,`)}]::text[]`;
      await db.execute(
        sql`UPDATE needradar.needs SET
          evidence_count = evidence_count + 1,
          sources = ${srcArr},
          regions = ${regArr},
          updated_at = NOW()
        WHERE id = ${existing.id}`
      );
      console.log(
        `↑ Updated (similar): "${existing.title}" (id:${existing.id}, similarity:${existing.similarity.toFixed(3)})`
      );
      updated++;
    } else {
      const [row] = await db
        .insert(needs)
        .values({
          title: need.title,
          summary: need.summary,
          vertical: need.vertical,
          sources: need.sources,
          regions: need.regions ?? [],
          embedding,
        })
        .returning({ id: needs.id });
      console.log(`+ Inserted: "${need.title}" (id:${row.id})`);
      inserted++;
    }
  }

  // 2) 証拠追加（id 直接）
  for (const add of evidenceAdditions) {
    const rows = await db.execute<{
      id: number;
      title: string;
      sources: string[];
      regions: string[];
    }>(sql`SELECT id, title, sources, regions FROM needradar.needs WHERE id = ${add.id}`);
    const cur = rows.rows[0];
    if (!cur) {
      console.warn(`! id=${add.id} not found, skip`);
      continue;
    }
    const mergedSources = Array.from(new Set([...(cur.sources ?? []), ...add.addSources]));
    const mergedRegions = Array.from(new Set([...(cur.regions ?? []), ...add.addRegions]));
    const srcArr = sql`ARRAY[${sql.join(mergedSources.map((v) => sql`${v}`), sql`,`)}]::text[]`;
    const regArr = sql`ARRAY[${sql.join(mergedRegions.map((v) => sql`${v}`), sql`,`)}]::text[]`;
    await db.execute(
      sql`UPDATE needradar.needs SET
        evidence_count = evidence_count + 1,
        sources = ${srcArr},
        regions = ${regArr},
        updated_at = NOW()
      WHERE id = ${add.id}`
    );
    console.log(`↑ Evidence+: "${cur.title}" (id:${add.id}) — ${add.note}`);
    updated++;
  }

  console.log(`\nDone. inserted=${inserted}, updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
