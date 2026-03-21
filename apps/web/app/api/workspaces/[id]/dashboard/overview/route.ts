import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: compute overview stats from db
  return NextResponse.json({
    workspaceId: id,
    averageScore: 0,
    totalAnalysed: 0,
    brandMentionRate: 0,
    competitorWinRate: 0,
  });
}
