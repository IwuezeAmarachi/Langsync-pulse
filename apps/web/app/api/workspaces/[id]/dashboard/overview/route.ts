import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const analyses = await db.analysis.findMany({
    where: { workspaceId: id },
    select: { score: true, brandMentioned: true, competitorCountMentioned: true },
  });

  const total = analyses.length;
  const averageScore = total > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / total)
    : 0;
  const brandMentionRate = total > 0
    ? analyses.filter((a) => a.brandMentioned).length / total
    : 0;
  const competitorWinRate = total > 0
    ? analyses.filter((a) => !a.brandMentioned && a.competitorCountMentioned > 0).length / total
    : 0;

  return NextResponse.json({
    workspaceId: id,
    totalAnalysed: total,
    averageScore,
    brandMentionRate: Math.round(brandMentionRate * 100) / 100,
    competitorWinRate: Math.round(competitorWinRate * 100) / 100,
  });
}
