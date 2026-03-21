import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const brand = await db.brand.findUnique({ where: { workspaceId: id } });
  return NextResponse.json({ brand });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireWorkspaceMember(id);
  if (error) return error;

  const json = await req.json();
  if (!json.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const brand = await db.brand.upsert({
    where: { workspaceId: id },
    create: {
      workspaceId: id,
      name: json.name,
      primaryDomain: json.primaryDomain ?? null,
      aliasesJson: json.aliases ?? [],
      productNamesJson: json.productNames ?? [],
      founderNamesJson: json.founderNames ?? [],
    },
    update: {
      name: json.name,
      primaryDomain: json.primaryDomain ?? null,
      aliasesJson: json.aliases ?? [],
      productNamesJson: json.productNames ?? [],
      founderNamesJson: json.founderNames ?? [],
    },
  });

  return NextResponse.json({ brand });
}
