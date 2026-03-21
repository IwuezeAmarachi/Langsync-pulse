import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const competitors = await db.competitor.findMany({
    where: { workspaceId: id, active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ competitors });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const competitor = await db.competitor.create({
    data: {
      workspaceId: id,
      name: json.name,
      primaryDomain: json.primaryDomain ?? null,
      aliasesJson: json.aliases ?? [],
    },
  });

  return NextResponse.json(competitor, { status: 201 });
}
