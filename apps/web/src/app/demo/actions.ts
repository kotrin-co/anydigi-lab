"use server";

import { db } from "@anydigi-lab/database/db";
import {
  demoReports,
  type DemoDepth,
  type DemoRole,
} from "@anydigi-lab/database/schema/demo";
import { and, eq, sql } from "drizzle-orm";

export type FetchReportInput = {
  questionSetId: number;
  topicIndex: number;
  role: DemoRole;
  depth: DemoDepth;
};

export type FetchReportResult =
  | {
      ok: true;
      report: {
        id: number;
        title: string;
        content: string;
        sourceArticleIds: string[] | null;
        viewCount: number;
      };
    }
  | { ok: false; reason: "not_found" };

export async function fetchReport(
  input: FetchReportInput
): Promise<FetchReportResult> {
  const [row] = await db
    .update(demoReports)
    .set({ viewCount: sql`${demoReports.viewCount} + 1` })
    .where(
      and(
        eq(demoReports.questionSetId, input.questionSetId),
        eq(demoReports.topicIndex, input.topicIndex),
        eq(demoReports.role, input.role),
        eq(demoReports.depth, input.depth)
      )
    )
    .returning({
      id: demoReports.id,
      title: demoReports.title,
      content: demoReports.content,
      sourceArticleIds: demoReports.sourceArticleIds,
      viewCount: demoReports.viewCount,
    });

  if (!row) return { ok: false, reason: "not_found" };
  return { ok: true, report: row };
}
