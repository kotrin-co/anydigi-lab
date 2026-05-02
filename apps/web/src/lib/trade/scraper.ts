/**
 * Yahoo Finance JP + IR Bank スクレイパー
 *
 * cheerio で HTML パースし、構造化データに変換する。
 */

import * as cheerio from "cheerio";
import type { YearlyData } from "./financial-scoring";

// ── 型定義 ──

export type YahooStock = {
  code: string;
  name: string;
  price: number | null;
  yieldPct: number | null;
};

export type IRBankData = {
  code: string;
  industry: string | null;
  years: YearlyData[];
  // 直近の追加指標（スコアリング用）
  latestPer: number | null;
  latestPbr: number | null;
  latestRoe: number | null;
  latestMarketCapMillion: number | null;
};

// ── ユーティリティ ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 日本語の数値表記をパース
 * "948億" → 94800 (百万円)
 * "53.6億" → 5360 (百万円)
 * "1,811" → 1811
 * "△10.5億" → -1050 (百万円)
 * "—" → null
 */
function parseJapaneseNumber(text: string): number | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/\s/g, "");
  if (trimmed === "" || trimmed === "—" || trimmed === "-" || trimmed === "–")
    return null;

  let negative = false;
  let cleaned = trimmed;

  // △ or ▲ = negative
  if (cleaned.startsWith("△") || cleaned.startsWith("▲")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }
  // マイナス記号
  if (cleaned.startsWith("-") || cleaned.startsWith("−")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }

  // カンマ除去
  cleaned = cleaned.replace(/,/g, "");

  // 単位変換（百万円ベース）
  let multiplier = 1;
  if (cleaned.endsWith("兆")) {
    multiplier = 1_000_000; // 1兆 = 100万百万
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("億")) {
    multiplier = 100; // 1億 = 100百万
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("万")) {
    multiplier = 0.01; // 1万 = 0.01百万
    cleaned = cleaned.slice(0, -1);
  }

  // % 除去
  cleaned = cleaned.replace(/%/g, "");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  const result = num * multiplier;
  return negative ? -result : result;
}

/**
 * パーセンテージや単純な数値をパース
 * "16.69" → 16.69
 * "53" → 53
 * "△2.5" → -2.5
 */
function parseSimpleNumber(text: string): number | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/\s/g, "");
  if (trimmed === "" || trimmed === "—" || trimmed === "-" || trimmed === "–")
    return null;

  let negative = false;
  let cleaned = trimmed;

  if (cleaned.startsWith("△") || cleaned.startsWith("▲")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith("-") || cleaned.startsWith("−")) {
    negative = true;
    cleaned = cleaned.slice(1);
  }

  cleaned = cleaned.replace(/,/g, "").replace(/%/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return negative ? -num : num;
}

// ── Yahoo Finance JP ──

/** 1ページ分のYahooランキングをパース */
function parseYahooRankingPage(html: string): YahooStock[] {
  const $ = cheerio.load(html);
  const stocks: YahooStock[] = [];

  // ランキングテーブルの行を走査
  // 構造: td[0]=名称+コード+市場, td[1]=取引値+日付, td[2]=決算年月, td[3]=1株配当, td[4]=配当利回り
  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 5) return;

    // td[0] から銘柄名とコードを抽出
    // 例: "アイザワ証券グループ(株)8708東証PRM掲示板"
    const nameCodeText = $(cells[0]).text().trim();
    const codeMatch = nameCodeText.match(/(\d{4}[A-Z]?)/);
    if (!codeMatch) return;

    const code = codeMatch[1];
    const name = nameCodeText.slice(0, codeMatch.index).trim();

    // REIT除外
    if (
      name.includes("投資法人") ||
      name.includes("リート") ||
      name.includes("REIT")
    )
      return;

    // td[1] から株価を抽出
    // 取引値セルは market 開場中は時刻 "1,33811:30"、閉場後は日付 "1,63104/17" が連結される。
    // 「3桁ごとのカンマ」ルールに従って先頭の数値部分だけを取り出す（例 "3,08511:30" → "3,085"）。
    const priceRaw = $(cells[1]).text().trim();
    const priceMatch = priceRaw.match(/^(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
    const price = priceMatch ? parseSimpleNumber(priceMatch[1]) : null;

    // td[4] から配当利回りを抽出（"+7.17%" → 7.17）
    const yieldText = $(cells[4]).text().trim();
    const yieldMatch = yieldText.match(/([0-9.]+)/);
    const yieldPct = yieldMatch ? parseFloat(yieldMatch[1]) : null;

    stocks.push({ code, name, price, yieldPct });
  });

  return stocks;
}

/** Yahoo配当利回りランキング — 1ページ目のみ（後方互換） */
export async function fetchDividendRanking(): Promise<YahooStock[]> {
  const url =
    "https://finance.yahoo.co.jp/stocks/ranking/dividendYield?market=all";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`Yahoo Finance fetch failed: ${res.status}`);
  return parseYahooRankingPage(await res.text());
}

/**
 * Yahoo配当利回りランキング — 全ページ取得
 * @param minYield 最低利回り（これ未満になったら終了）
 */
export async function fetchAllDividendRanking(
  minYield = 3.0
): Promise<YahooStock[]> {
  const allStocks: YahooStock[] = [];
  let page = 1;
  const maxPages = 100; // 安全弁

  while (page <= maxPages) {
    const url = `https://finance.yahoo.co.jp/stocks/ranking/dividendYield?market=all&page=${page}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) {
      console.warn(`  [WARN] Yahoo page ${page}: HTTP ${res.status}`);
      break;
    }

    const pageStocks = parseYahooRankingPage(await res.text());
    if (pageStocks.length === 0) break;

    // 最低利回りチェック
    const lastYield = pageStocks[pageStocks.length - 1].yieldPct ?? 0;
    allStocks.push(...pageStocks);

    if (lastYield < minYield) {
      // このページに minYield 未満が含まれた → 対象外を除外して終了
      break;
    }

    console.log(`  Yahoo page ${page}: ${pageStocks.length}銘柄 (末尾利回り ${lastYield}%)`);
    page++;

    // 軽いレートリミット
    await sleep(500);
  }

  // minYield 未満を除外
  return allStocks.filter((s) => (s.yieldPct ?? 0) >= minYield);
}

// ── IR Bank ──

/**
 * IRバンクのテーブルをインデックスで取得しパースする
 *
 * IRバンクの /results ページにはclass="bar bs"のテーブルが4つ:
 *   [0] 会社業績: 年度,売上,営利,経常,当期利益,包括,EPS,ROE,ROA,営利率,販管費率
 *   [1] 財務状況: 年度,総資産,純資産,株主資本,自己資本比率,...,BPS
 *   [2] キャッシュ・フロー: 年度,営業CF,投資CF,財務CF,フリーCF,設備投資,現金等,営業CFマージン
 *   [3] 配当推移: 年度,一株配当,配当性向,...
 */
function parseTable(
  $: cheerio.CheerioAPI,
  tableIndex: number
): { headers: string[]; rows: Record<string, string>[] } {
  const result: { headers: string[]; rows: Record<string, string>[] } = {
    headers: [],
    rows: [],
  };

  const table = $("table").eq(tableIndex);
  if (!table.length) return result;

  // ヘッダー行（theadのみ。tr:first-childを含めると重複する）
  const thead = table.find("thead tr th");
  if (thead.length > 0) {
    thead.each((_, th) => {
      result.headers.push($(th).text().trim());
    });
  } else {
    // theadがない場合はfirst rowのthを使う
    table.find("tr:first-child th").each((_, th) => {
      result.headers.push($(th).text().trim());
    });
  }

  // データ行（tbody tr）
  table.find("tbody tr").each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find("td")
      .each((_, cell) => {
        cells.push($(cell).text().trim());
      });

    if (cells.length > 0 && result.headers.length > 0) {
      const row: Record<string, string> = {};
      for (let i = 0; i < Math.min(cells.length, result.headers.length); i++) {
        row[result.headers[i]] = cells[i];
      }
      result.rows.push(row);
    }
  });

  return result;
}

export async function fetchIRBankData(
  code: string
): Promise<IRBankData | null> {
  const url = `https://irbank.net/${code}/results`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) {
      console.warn(`  [WARN] IR Bank ${code}: HTTP ${res.status}`);
      return null;
    }
    html = await res.text();
  } catch (e) {
    console.warn(`  [WARN] IR Bank ${code}: fetch error`, e);
    return null;
  }

  const $ = cheerio.load(html);

  // 業種を取得（/category/ リンクから）
  let industry: string | null = null;
  $("a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("/category/")) {
      industry = $(el).text().trim();
    }
  });

  // 4テーブルをインデックスで取得
  const perfTable = parseTable($, 0);   // 会社業績
  const bsTable = parseTable($, 1);     // 財務状況
  const cfTable = parseTable($, 2);     // キャッシュ・フロー
  const divTable = parseTable($, 3);    // 配当推移

  // 年度でマージ
  const yearMap = new Map<string, Partial<YearlyData>>();

  // 会社業績: 売上, EPS, 営利率
  for (const row of perfTable.rows) {
    const fy = row["年度"] || row[perfTable.headers[0]];
    if (!fy || fy.includes("予")) continue; // 予想は除外
    const entry: Partial<YearlyData> = { fiscalYear: fy };
    entry.revenue = parseJapaneseNumber(row["売上"] ?? row["営業収益"] ?? "");
    entry.eps = parseSimpleNumber(row["EPS"] ?? "");
    entry.operatingMargin = parseSimpleNumber(row["営利率"] ?? "");
    yearMap.set(fy, { ...yearMap.get(fy), ...entry });
  }

  // 財務状況: 自己資本比率
  for (const row of bsTable.rows) {
    const fy = row["年度"] || row[bsTable.headers[0]];
    if (!fy || fy.includes("予")) continue;
    const entry: Partial<YearlyData> = {};
    entry.equityRatio = parseSimpleNumber(row["自己資本比率"] ?? "");
    yearMap.set(fy, { ...yearMap.get(fy), ...entry });
  }

  // キャッシュ・フロー: 営業CF, 現金等
  for (const row of cfTable.rows) {
    const fy = row["年度"] || row[cfTable.headers[0]];
    if (!fy || fy.includes("予")) continue;
    const entry: Partial<YearlyData> = {};
    entry.operatingCf = parseJapaneseNumber(row["営業CF"] ?? "");
    entry.cashEquivalents = parseJapaneseNumber(row["現金等"] ?? "");
    yearMap.set(fy, { ...yearMap.get(fy), ...entry });
  }

  // 配当推移: 一株配当, 配当性向
  for (const row of divTable.rows) {
    const fy = row["年度"] || row[divTable.headers[0]];
    if (!fy || fy.includes("予")) continue;
    const entry: Partial<YearlyData> = {};
    entry.dividendPerShare = parseSimpleNumber(row["一株配当"] ?? "");
    entry.payoutRatio = parseSimpleNumber(row["配当性向"] ?? "");
    yearMap.set(fy, { ...yearMap.get(fy), ...entry });
  }

  // 年度順にソート（古い順）し、直近10年に絞る
  const allYears = Array.from(yearMap.entries())
    .map(([fy, data]) => ({
      fiscalYear: fy,
      revenue: data.revenue ?? null,
      eps: data.eps ?? null,
      operatingMargin: data.operatingMargin ?? null,
      equityRatio: data.equityRatio ?? null,
      operatingCf: data.operatingCf ?? null,
      cashEquivalents: data.cashEquivalents ?? null,
      dividendPerShare: data.dividendPerShare ?? null,
      payoutRatio: data.payoutRatio ?? null,
    }))
    .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

  const years = allYears.slice(-10);

  // 直近の追加指標
  const latestPerf = perfTable.rows[perfTable.rows.length - 1];
  const latestBs = bsTable.rows[bsTable.rows.length - 1];

  return {
    code,
    industry,
    years,
    latestPer: null, // IRバンクにPERはないので、Yahoo/別ソースから
    latestPbr: parseSimpleNumber(latestBs?.["BPS"] ?? "")
      ? null
      : null, // PBRは直接取得できない
    latestRoe: parseSimpleNumber(latestPerf?.["ROE"] ?? ""),
    latestMarketCapMillion: null, // 別途取得
  };
}

// ── Yahoo Finance 個別銘柄（PER/PBR/ROE取得） ──

export type YahooStockDetail = {
  code: string;
  per: number | null;
  pbr: number | null;
  roe: number | null;
};

/**
 * Yahoo Finance 個別銘柄ページから PER/PBR/ROE を取得
 */
export async function fetchYahooStockDetail(
  code: string
): Promise<YahooStockDetail | null> {
  const url = `https://finance.yahoo.co.jp/quote/${code}.T`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    let per: number | null = null;
    let pbr: number | null = null;
    let roe: number | null = null;

    $("dl").each((_, dl) => {
      const dt = $(dl).find("dt").text().trim();
      const dd = $(dl).find("dd").text().trim();
      if (dt.includes("PER") && dt.includes("会社予想")) {
        const m = dd.match(/([\d.]+)倍/);
        if (m) per = parseFloat(m[1]);
      } else if (dt.includes("PBR") && dt.includes("実績")) {
        const m = dd.match(/([\d.]+)倍/);
        if (m) pbr = parseFloat(m[1]);
      } else if (dt.includes("ROE") && dt.includes("実績")) {
        const m = dd.match(/([\d.]+)%/);
        if (m) roe = parseFloat(m[1]);
      }
    });

    return { code, per, pbr, roe };
  } catch {
    return null;
  }
}

// ── バッチ取得（レートリミット付き） ──

export async function fetchAllIRBankData(
  codes: string[],
  delayMs = 2000
): Promise<Map<string, IRBankData>> {
  const results = new Map<string, IRBankData>();

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    console.log(
      `  [${i + 1}/${codes.length}] Fetching IR Bank: ${code}...`
    );

    const data = await fetchIRBankData(code);
    if (data && data.years.length > 0) {
      results.set(code, data);
    } else {
      console.warn(`  [SKIP] ${code}: データ取得失敗またはデータなし`);
    }

    // レートリミット（最後の1件は不要）
    if (i < codes.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}
