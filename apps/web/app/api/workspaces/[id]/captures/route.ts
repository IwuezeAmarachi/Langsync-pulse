import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch captures for workspace from db with pagination
  return NextResponse.json({ workspaceId: id, captures: [], total: 0 });
}
