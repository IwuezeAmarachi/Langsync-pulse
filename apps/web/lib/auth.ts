import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@langsync/db";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  const user = await db.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email,
      fullName: clerkUser?.fullName ?? null,
      authProvider: "clerk",
    },
    update: { email },
  });

  return { user, error: null };
}

export async function requireWorkspaceMember(workspaceId: string) {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user!.id } },
  });

  if (!member) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: user!, error: null };
}
