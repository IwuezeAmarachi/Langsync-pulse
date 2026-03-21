import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const prompts = await db.prompt.findMany({
    where: { workspaceId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const json = await req.json();
  if (!json.promptText) {
    return NextResponse.json({ error: "promptText is required" }, { status: 400 });
  }

  const prompt = await db.prompt.create({
    data: {
      workspaceId: id,
      promptText: json.promptText,
      category: json.category ?? null,
      priority: json.priority ?? "normal",
      geography: json.geography ?? null,
      platformScopeJson: json.platformScope ?? [],
      notes: json.notes ?? null,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
