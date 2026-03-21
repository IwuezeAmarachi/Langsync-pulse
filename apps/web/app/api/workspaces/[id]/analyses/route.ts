import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch analyses for workspace from db with pagination
  return NextResponse.json({ workspaceId: id, analyses: [], total: 0 });
}
