import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch competitors for workspace from db
  return NextResponse.json({ workspaceId: id, competitors: [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  // TODO: persist competitor in db
  return NextResponse.json(
    { id: `comp_${crypto.randomUUID()}`, workspaceId: id, ...json },
    { status: 201 }
  );
}
