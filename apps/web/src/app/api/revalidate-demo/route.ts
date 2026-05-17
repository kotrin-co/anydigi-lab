import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const token = req.headers.get("x-revalidate-token");
  const expected = process.env.REVALIDATE_TOKEN;

  if (!expected || token !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  revalidatePath("/demo");
  return Response.json({ ok: true, revalidated: "/demo", at: new Date().toISOString() });
}
