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

  const [captures, total] = await Promise.all([
    db.capture.findMany({
      where: { workspaceId: id },
      orderBy: { capturedAt: "desc" },
      skip,
      take: limit,
      include: { analysis: { select: { score: true, brandMentioned: true } } },
    }),
    db.capture.count({ where: { workspaceId: id } }),
  ]);

  return NextResponse.json({ captures, total, page, limit });
}
