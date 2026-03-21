import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const prompts = await db.prompt.findMany({
    where: { workspaceId: id },
    include: {
      captures: {
        include: { analysis: { select: { score: true, brandMentioned: true, processedAt: true } } },
        orderBy: { capturedAt: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = prompts.map((p) => {
    const analyses = p.captures
      .map((c) => c.analysis)
      .filter(Boolean)
      .sort((a, b) => b!.processedAt.getTime() - a!.processedAt.getTime());

    const latestScore = analyses[0]?.score ?? null;
    const trend = analyses
      .slice(0, 7)
      .reverse()
      .map((a) => ({ score: a!.score, date: a!.processedAt.toISOString().slice(0, 10) }));

    return {
      id: p.id,
      promptText: p.promptText,
      category: p.category,
      priority: p.priority,
      latestScore,
      trend,
      captureCount: p.captures.length,
    };
  });

  return NextResponse.json({ workspaceId: id, prompts: result });
}
