import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@langsync/db";

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken();

  // Return first workspace this user belongs to
  const membership = await db.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    token,
    workspaceId: membership?.workspace.id ?? null,
    workspaceName: membership?.workspace.name ?? null,
  });
}
