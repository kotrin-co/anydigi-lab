import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const result = await db.execute(sql`SELECT now()`);
  return Response.json({ status: "ok", time: result.rows[0].now });
}
