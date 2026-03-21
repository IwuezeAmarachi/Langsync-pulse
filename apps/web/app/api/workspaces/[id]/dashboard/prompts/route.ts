import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: return latest score per prompt + trend from db
  return NextResponse.json({ workspaceId: id, prompts: [] });
}
