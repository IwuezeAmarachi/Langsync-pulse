import { NextResponse } from "next/server";
import { CapturePayloadSchema } from "@langsync/shared-types";
import { analyseCapture } from "@langsync/analysis-engine";

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = CapturePayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const captureId = `cap_${crypto.randomUUID()}`;

  const analysisPreview = analyseCapture({
    responseText: parsed.data.responseText,
    brandAliases: ["LangSync", "LangSync Pulse"],
    competitors: [{ name: "Competitor", aliases: ["Competitor"] }],
    citations: parsed.data.citations
  });

  return NextResponse.json({
    captureId,
    status: "accepted",
    analysisQueued: true,
    preview: analysisPreview
  });
}
