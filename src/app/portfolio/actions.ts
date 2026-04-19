"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, portfolios, holdings } from "@/lib/schema/users";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getOrCreatePortfolio(userId: number) {
  const [existing] = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(eq(portfolios.userId, userId))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(portfolios)
    .values({ userId, name: "メインポートフォリオ" })
    .returning({ id: portfolios.id });

  return created.id;
}

async function getUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const [user] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, session.user.email))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}

export async function addHolding(formData: FormData) {
  const user = await getUser();
  const portfolioId = await getOrCreatePortfolio(user.id);

  const assetType = formData.get("assetType") as string;
  const name = formData.get("name") as string;
  const account = (formData.get("account") as string) || null;
  const code = (formData.get("code") as string) || null;
  const costBasis = formData.get("costBasis")
    ? parseFloat(formData.get("costBasis") as string)
    : null;
  const marketValue = formData.get("marketValue")
    ? parseFloat(formData.get("marketValue") as string)
    : null;
  const memo = (formData.get("memo") as string) || null;

  if (!assetType || !name) throw new Error("名称は必須です");

  await db.insert(holdings).values({
    portfolioId,
    assetType,
    account,
    name,
    code,
    costBasis,
    marketValue,
    memo,
  });

  revalidatePath("/portfolio");
}

export async function updateHolding(formData: FormData) {
  const user = await getUser();
  const portfolioId = await getOrCreatePortfolio(user.id);
  const holdingId = parseInt(formData.get("id") as string);

  const name = formData.get("name") as string;
  const account = (formData.get("account") as string) || null;
  const code = (formData.get("code") as string) || null;
  const costBasis = formData.get("costBasis")
    ? parseFloat(formData.get("costBasis") as string)
    : null;
  const marketValue = formData.get("marketValue")
    ? parseFloat(formData.get("marketValue") as string)
    : null;
  const memo = (formData.get("memo") as string) || null;

  if (!name) throw new Error("名称は必須です");

  await db
    .update(holdings)
    .set({ name, account, code, costBasis, marketValue, memo, updatedAt: new Date() })
    .where(
      and(eq(holdings.id, holdingId), eq(holdings.portfolioId, portfolioId))
    );

  revalidatePath("/portfolio");
}

export async function deleteHolding(formData: FormData) {
  const user = await getUser();
  const portfolioId = await getOrCreatePortfolio(user.id);
  const holdingId = parseInt(formData.get("id") as string);

  await db
    .delete(holdings)
    .where(
      and(eq(holdings.id, holdingId), eq(holdings.portfolioId, portfolioId))
    );

  revalidatePath("/portfolio");
}
