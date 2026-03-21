import { analyseCapture } from "@langsync/analysis-engine";
import type { Competitor, Citation } from "@langsync/shared-types";

export type AnalyseCaptureJobData = {
  captureId: string;
  workspaceId: string;
  platform: string;
  responseText: string;
  brandAliases: string[];
  ownedDomains: string[];
  competitors: Competitor[];
  citations: Citation[];
};

export async function processAnalyseCapture(data: AnalyseCaptureJobData) {
  const result = analyseCapture({
    platform: data.platform,
    responseText: data.responseText,
    brandAliases: data.brandAliases,
    ownedDomains: data.ownedDomains,
    competitors: data.competitors,
    citations: data.citations,
  });

  // TODO: persist result to db using @langsync/db
  // await db.analysis.create({ data: { captureId: data.captureId, workspaceId: data.workspaceId, ...result } })

  console.log(`[analyse_capture] captureId=${data.captureId} score=${result.score}`);
  return result;
}
