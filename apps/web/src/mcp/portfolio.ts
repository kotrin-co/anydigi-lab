import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "@anydigi-lab/database/db";
import { profiles, portfolios, holdings } from "@anydigi-lab/database/schema/users";
import { eq } from "drizzle-orm";
import { z } from "zod";

const getUserPortfolio = async (email: string) => {
  const [user] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (!user) return null;

  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, user.id))
    .limit(1);

  return portfolio ?? null;
};

const fmt = (v: number | null) =>
  v !== null ? Math.round(v).toLocaleString() : null;

const returnNotFound = () => {
  return {
    content: [
      {
        type: "text" as const,
        text: "ポートフォリオが見つかりません",
      },
    ],
  };
};

export const registerPortfolioTools = (server: McpServer, email: string) => {
  // 1. ポートフォリオ一覧取得
  server.registerTool(
    "get_portfolio",
    {
      description: "保有資産の一覧を取得する。評価額・投資額・損益率を含む",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const portfolio = await getUserPortfolio(email);
      if (!portfolio) {
        return returnNotFound();
      }

      const allHoldings = await db
        .select()
        .from(holdings)
        .where(eq(holdings.portfolioId, portfolio.id));

      const result = allHoldings.map((h) => ({
        id: h.id,
        assetType: h.assetType,
        account: h.account,
        code: h.code,
        name: h.name,
        costBasis: fmt(h.costBasis),
        marketValue: fmt(h.marketValue),
        pctChange:
          h.costBasis && h.marketValue && h.costBasis > 0
            ? `${(((h.marketValue - h.costBasis) / h.costBasis) * 100).toFixed(1)}%`
            : null,
        memo: h.memo,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // 2. サマリー取得
  server.registerTool(
    "get_portfolio_summary",
    {
      description:
        "保有資産のサマリーを取得する。アセットタイプ別集計・合計評価額・投資額・損益・資産配分比率を含む",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const portfolio = await getUserPortfolio(email);
      if (!portfolio) {
        return returnNotFound();
      }

      const allHoldings = await db
        .select()
        .from(holdings)
        .where(eq(holdings.portfolioId, portfolio.id));

      const byType: Record<
        string,
        { count: number; costBasis: number; marketValue: number }
      > = {};

      for (const h of allHoldings) {
        if (!byType[h.assetType]) {
          byType[h.assetType] = { count: 0, costBasis: 0, marketValue: 0 };
        }

        byType[h.assetType].count++;
        byType[h.assetType].costBasis += h.costBasis ?? 0;
        byType[h.assetType].marketValue += h.marketValue ?? 0;
      }

      const totalCost = allHoldings.reduce(
        (sum, h) => sum + (h.costBasis ?? 0),
        0,
      );
      const totalMarket = allHoldings.reduce(
        (sum, h) => sum + (h.marketValue ?? 0),
        0,
      );

      const allocation = Object.entries(byType).map(([type, data]) => ({
        assetType: type,
        ratio:
          totalMarket > 0
            ? `${((data.marketValue / totalMarket) * 100).toFixed(1)}%`
            : "0%",
        ...data,
      }));

      const summary = {
        totalHoldings: allHoldings.length,
        totalCostBasis: fmt(totalCost),
        totalMarketValue: fmt(totalMarket),
        totalPnL: fmt(totalMarket - totalCost),
        totalPnLPct:
          totalCost > 0
            ? `${(((totalMarket - totalCost) / totalCost) * 100).toFixed(1)}%`
            : null,
        allocation,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    },
  );

  // 3. アセットタイプでフィルタ
  server.registerTool(
    "get_portfolio_by_type",
    {
      description: "指定したアセットタイプの保有資産のみを取得する",
      inputSchema: {
        assetType: z
          .enum([
            "index_fund",
            "jp_stock",
            "foreign_stock",
            "crypto",
            "real_estate",
            "bond",
            "pension",
            "cash",
            "insurance",
            "business",
          ])
          .describe("アセットタイプ"),
      },
    },
    async ({ assetType }) => {
      const portfolio = await getUserPortfolio(email);
      if (!portfolio) {
        return returnNotFound();
      }

      const allHoldings = await db
        .select()
        .from(holdings)
        .where(eq(holdings.portfolioId, portfolio.id));

      const filtered = allHoldings
        .filter((h) => h.assetType === assetType)
        .map((h) => ({
          name: h.name,
          account: h.account,
          code: h.code,
          costBasis: fmt(h.costBasis),
          marketValue: fmt(h.marketValue),
          pctChange:
            h.costBasis && h.marketValue && h.costBasis > 0
              ? `${(((h.marketValue - h.costBasis) / h.costBasis) * 100).toFixed(1)}%`
              : null,
          memo: h.memo,
        }));

      return {
        content: [
          {
            type: "text" as const,
            text:
              filtered.length > 0
                ? JSON.stringify(filtered, null, 2)
                : `アセットタイプ「${assetType}」の保有資産はありません`,
          },
        ],
      };
    },
  );
};
