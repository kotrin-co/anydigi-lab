import { db } from "@anydigi-lab/database/db";
import { holdings } from "@anydigi-lab/database/schema/users";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

const scale = parseFloat(process.argv[2] || "0.1");
const mode = process.argv[3]; // "restore" to restore from backup

async function main() {
  if (mode === "restore") {
    const backup = JSON.parse(
      readFileSync(resolve(__dirname, "holdings-backup-20260419.json"), "utf-8")
    );
    for (const h of backup) {
      await db
        .update(holdings)
        .set({ costBasis: h.cost_basis, marketValue: h.market_value })
        .where(eq(holdings.id, h.id));
    }
    console.log(`Restored ${backup.length} holdings from backup`);
    return;
  }

  const all = await db.select().from(holdings);
  for (const h of all) {
    await db
      .update(holdings)
      .set({
        costBasis: h.costBasis ? Math.round(h.costBasis * scale) : null,
        marketValue: h.marketValue ? Math.round(h.marketValue * scale) : null,
      })
      .where(eq(holdings.id, h.id));
  }
  console.log(`Scaled ${all.length} holdings by ${scale}x`);
}

main().catch(console.error).finally(() => process.exit());
