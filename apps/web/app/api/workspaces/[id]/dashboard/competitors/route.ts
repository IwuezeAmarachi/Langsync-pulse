import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: aggregate competitor mention counts from db
  return NextResponse.json({ workspaceId: id, competitors: [] });
}
