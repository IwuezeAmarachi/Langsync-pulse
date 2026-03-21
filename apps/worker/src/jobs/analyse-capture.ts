import { analyseCapture } from "@langsync/analysis-engine";
import { db } from "@langsync/db";
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

  await db.analysis.create({
    data: {
      captureId: data.captureId,
      workspaceId: data.workspaceId,
      brandMentioned: result.brandMentioned,
      brandMentionCount: result.brandMentionCount,
      brandFirstPosition: result.brandFirstPosition ?? null,
      competitorCountMentioned: result.competitorCountMentioned,
      score: result.score,
      scoreBreakdownJson: result.scoreBreakdown,
      recommendationSummary: result.recommendations[0]?.message ?? null,
      mentions: {
        create: data.competitors
          .filter((c) => {
            const aliases = c.aliases.length ? c.aliases : [c.name];
            return aliases.some((a) =>
              data.responseText.toLowerCase().includes(a.toLowerCase())
            );
          })
          .map((c) => ({
            entityName: c.name,
            entityType: "competitor",
            mentionCount: 1,
          })),
      },
      citations: {
        create: data.citations.map((c) => {
          let rootDomain = "";
          try {
            rootDomain = new URL(c.url).hostname.replace(/^www\./, "");
          } catch {}
          const isOwned = data.ownedDomains.some((d) => rootDomain.includes(d));
          const isCompetitor = data.competitors.some((comp) =>
            rootDomain.includes(comp.name.toLowerCase())
          );
          return {
            url: c.url,
            rootDomain,
            sourceType: isOwned ? "owned" : isCompetitor ? "competitor" : "third-party",
            title: c.label ?? null,
          };
        }),
      },
      recommendations: {
        create: result.recommendations.map((r) => ({
          ruleKey: r.ruleKey,
          priority: r.priority,
          message: r.message,
        })),
      },
    },
  });

  // Mark capture as processed
  await db.capture.update({
    where: { id: data.captureId },
    data: { ingestionStatus: "processed" },
  });

  console.log(`[analyse_capture] captureId=${data.captureId} score=${result.score}`);
  return result;
}
