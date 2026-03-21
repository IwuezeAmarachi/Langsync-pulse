import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const citations = await db.citationRecord.findMany({
    where: { analysis: { workspaceId: id } },
    select: { rootDomain: true, sourceType: true },
  });

  // Aggregate by domain
  const totals = new Map<string, { count: number; sourceType: string }>();
  for (const c of citations) {
    const domain = c.rootDomain ?? "unknown";
    if (!totals.has(domain)) totals.set(domain, { count: 0, sourceType: c.sourceType });
    totals.get(domain)!.count += 1;
  }

  const sources = Array.from(totals.entries())
    .map(([domain, { count, sourceType }]) => ({ domain, count, sourceType }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return NextResponse.json({ workspaceId: id, sources });
}
