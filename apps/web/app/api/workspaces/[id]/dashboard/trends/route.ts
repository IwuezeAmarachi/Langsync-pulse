import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Number(searchParams.get("days") ?? 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const analyses = await db.analysis.findMany({
    where: { workspaceId: id, processedAt: { gte: since } },
    select: { score: true, brandMentioned: true, processedAt: true },
    orderBy: { processedAt: "asc" },
  });

  // Group by day (YYYY-MM-DD)
  const byDay = new Map<string, { scores: number[]; brandMentions: number }>();
  for (const a of analyses) {
    const day = a.processedAt.toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { scores: [], brandMentions: 0 });
    const entry = byDay.get(day)!;
    entry.scores.push(a.score);
    if (a.brandMentioned) entry.brandMentions += 1;
  }

  const trends = Array.from(byDay.entries()).map(([date, { scores, brandMentions }]) => ({
    date,
    averageScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    count: scores.length,
    brandMentions,
  }));

  return NextResponse.json({ workspaceId: id, trends });
}
