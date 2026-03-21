import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    db.analysis.findMany({
      where: { workspaceId: id },
      orderBy: { processedAt: "desc" },
      skip,
      take: limit,
      include: {
        mentions: true,
        citations: true,
        recommendations: true,
        capture: { select: { platform: true, promptText: true, capturedAt: true } },
      },
    }),
    db.analysis.count({ where: { workspaceId: id } }),
  ]);

  return NextResponse.json({ analyses, total, page, limit });
}
