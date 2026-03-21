import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const mentions = await db.mention.findMany({
    where: { analysis: { workspaceId: id }, entityType: "competitor" },
    select: { entityName: true, mentionCount: true },
  });

  // Aggregate by competitor name
  const totals = new Map<string, number>();
  for (const m of mentions) {
    totals.set(m.entityName, (totals.get(m.entityName) ?? 0) + m.mentionCount);
  }

  const competitors = Array.from(totals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ workspaceId: id, competitors });
}
