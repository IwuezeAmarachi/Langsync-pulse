import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch brand for workspace from db
  return NextResponse.json({ workspaceId: id, brand: null });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  // TODO: upsert brand in db
  return NextResponse.json({ workspaceId: id, ...json });
}
