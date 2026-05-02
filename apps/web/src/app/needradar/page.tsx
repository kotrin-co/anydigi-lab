import { db } from "@anydigi-lab/database/db";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { eq, desc } from "drizzle-orm";
import { NeedsList } from "./needs-list";

async function getNeeds() {
  const rows = await db
    .select({
      id: needs.id,
      title: needs.title,
      summary: needs.summary,
      vertical: needs.vertical,
      evidenceCount: needs.evidenceCount,
      sources: needs.sources,
      regions: needs.regions,
      status: needs.status,
      createdAt: needs.createdAt,
      updatedAt: needs.updatedAt,
    })
    .from(needs)
    .where(eq(needs.status, "active"))
    .orderBy(desc(needs.evidenceCount), desc(needs.updatedAt));

  return rows;
}

export default async function NeedradarPage() {
  const needsList = await getNeeds();

  const verticalCounts = needsList.reduce<Record<string, number>>((acc, n) => {
    acc[n.vertical] = (acc[n.vertical] ?? 0) + 1;
    return acc;
  }, {});

  const sourceCounts = needsList.reduce<Record<string, number>>((acc, n) => {
    const seen = new Set<string>();
    for (const src of n.sources ?? []) {
      const prefix = extractSourcePrefix(src);
      if (prefix && !seen.has(prefix)) {
        seen.add(prefix);
        acc[prefix] = (acc[prefix] ?? 0) + 1;
      }
    }
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          NeedRadar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          YouTubeコメント・Reddit・RSS等から抽出したニーズを縦軸別に表示
        </p>
      </div>

      <NeedsList
        needs={needsList}
        verticalCounts={verticalCounts}
        sourceCounts={sourceCounts}
      />
    </div>
  );
}

function extractSourcePrefix(src: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return "web";
  const slashIdx = src.indexOf("/");
  if (slashIdx > 0) return src.slice(0, slashIdx);
  return src;
}
