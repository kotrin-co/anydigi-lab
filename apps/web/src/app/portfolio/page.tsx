import { auth } from "@/lib/auth";
import { db } from "@anydigi-lab/database/db";
import { profiles, portfolios, holdings } from "@anydigi-lab/database/schema/users";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PortfolioView } from "./portfolio-view";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/portfolio");

  const [user] = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.email, session.user.email))
    .limit(1);

  if (!user) redirect("/");

  // ポートフォリオ取得（なければ空配列）
  const [portfolio] = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(eq(portfolios.userId, user.id))
    .limit(1);

  const allHoldings = portfolio
    ? await db
        .select()
        .from(holdings)
        .where(eq(holdings.portfolioId, portfolio.id))
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Portfolio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          資産ポートフォリオの管理
        </p>
      </div>

      <PortfolioView holdings={allHoldings} />
    </div>
  );
}
