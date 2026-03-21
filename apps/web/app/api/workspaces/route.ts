import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const workspaces = await db.workspace.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ workspaces });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const workspace = await db.workspace.create({
    data: {
      name: json.name,
      createdByUserId: user.id,
      members: {
        create: { userId: user.id, role: "owner" },
      },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
}
