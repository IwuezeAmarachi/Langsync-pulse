import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: compute score trend by day/week from db
  return NextResponse.json({ workspaceId: id, trends: [] });
}
