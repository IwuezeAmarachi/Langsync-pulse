import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch prompts for workspace from db
  return NextResponse.json({ workspaceId: id, prompts: [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  if (!json.promptText) {
    return NextResponse.json({ error: "promptText is required" }, { status: 400 });
  }
  // TODO: persist prompt in db
  return NextResponse.json(
    { id: `prompt_${crypto.randomUUID()}`, workspaceId: id, ...json },
    { status: 201 }
  );
}
