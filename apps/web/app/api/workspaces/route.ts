import { NextResponse } from "next/server";

export async function GET() {
  // TODO: validate JWT, return workspaces for authenticated user
  return NextResponse.json({ workspaces: [] });
}

export async function POST(req: Request) {
  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  // TODO: persist workspace via db
  return NextResponse.json(
    { id: `ws_${crypto.randomUUID()}`, name: json.name },
    { status: 201 }
  );
}
