import { NextResponse } from "next/server";
import { db } from "@langsync/db";
import { CapturePayloadSchema } from "@langsync/shared-types";
import { requireUser } from "@/lib/auth";
import { getAnalysisQueue } from "@/lib/queue";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const json = await req.json();
  const parsed = CapturePayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify caller is a member of the target workspace
  const member = await db.workspaceMember.findFirst({
    where: { workspaceId: data.workspaceId },
  });
  if (!member) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Dedup: skip if identical response already captured
  const responseHash = createHash("sha256").update(data.responseText).digest("hex");
  const existing = await db.capture.findFirst({
    where: { workspaceId: data.workspaceId, responseHash },
  });
  if (existing) {
    return NextResponse.json({ captureId: existing.id, status: "duplicate", analysisQueued: false });
  }

  // Match to a tracked prompt if possible
  const prompts = await db.prompt.findMany({ where: { workspaceId: data.workspaceId } });
  const normInput = data.promptText.toLowerCase().trim();
  const matchedPrompt = prompts.find(
    (p) => p.promptText.toLowerCase().trim() === normInput
  );

  const capture = await db.capture.create({
    data: {
      workspaceId: data.workspaceId,
      promptId: matchedPrompt?.id ?? null,
      platform: data.platform,
      promptText: data.promptText,
      responseText: data.responseText,
      responseHash,
      citationsRawJson: data.citations,
      captureMode: data.captureMode,
      pageUrl: data.pageUrl,
      capturedAt: new Date(data.capturedAt),
      ingestionStatus: "queued",
    },
  });

  // Fetch brand + competitors for analysis job
  const [brand, competitors] = await Promise.all([
    db.brand.findUnique({ where: { workspaceId: data.workspaceId } }),
    db.competitor.findMany({ where: { workspaceId: data.workspaceId, active: true } }),
  ]);

  const brandAliases = [
    brand?.name ?? "",
    ...((brand?.aliasesJson as string[]) ?? []),
    ...((brand?.productNamesJson as string[]) ?? []),
  ].filter(Boolean);

  const ownedDomains = brand?.primaryDomain ? [brand.primaryDomain] : [];

  const competitorList = competitors.map((c) => ({
    name: c.name,
    aliases: (c.aliasesJson as string[]) ?? [],
  }));

  try {
    const queue = getAnalysisQueue();
    await queue.add("analyse_capture", {
      captureId: capture.id,
      workspaceId: data.workspaceId,
      platform: data.platform,
      responseText: data.responseText,
      brandAliases,
      ownedDomains,
      competitors: competitorList,
      citations: data.citations,
    });
  } catch {
    // Queue unavailable — mark capture so it can be retried later
    await db.capture.update({
      where: { id: capture.id },
      data: { ingestionStatus: "pending" },
    });
  }

  return NextResponse.json({ captureId: capture.id, status: "accepted", analysisQueued: true });
}
