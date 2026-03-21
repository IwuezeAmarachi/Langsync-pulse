import type { AnalysisResult, Citation, Competitor } from "@langsync/shared-types";
import { normalise, stripMarkdown } from "./text-normaliser.js";
import { matchAliases } from "./entity-matcher.js";
import { parseCitations } from "./citation-parser.js";
import { computeScore } from "./scoring.js";
import { generateRecommendations } from "./recommendations.js";

export { normalise, stripMarkdown } from "./text-normaliser.js";
export { matchAliases } from "./entity-matcher.js";
export { parseCitations } from "./citation-parser.js";
export { computeScore } from "./scoring.js";
export { generateRecommendations } from "./recommendations.js";

type AnalyseInput = {
  platform?: string;
  responseText: string;
  brandAliases: string[];
  ownedDomains?: string[];
  competitors: Competitor[];
  citations: Citation[];
};

export function analyseCapture(input: AnalyseInput): AnalysisResult {
  const cleaned = stripMarkdown(input.responseText);
  const normalisedText = normalise(cleaned);

  const brand = matchAliases(normalisedText, input.brandAliases);

  let competitorCountMentioned = 0;
  for (const competitor of input.competitors) {
    const aliases = competitor.aliases.length ? competitor.aliases : [competitor.name];
    const c = matchAliases(normalisedText, aliases);
    if (c.total > 0) competitorCountMentioned += 1;
  }

  const parsedCitations = parseCitations(
    input.citations,
    input.ownedDomains ?? [],
    input.competitors.map((c) => c.name.toLowerCase())
  );

  const hasOwnedCitation = parsedCitations.some((c) => c.sourceType === "owned");
  const thirdPartyDomainCount = parsedCitations.filter(
    (c) => c.sourceType === "third-party"
  ).length;

  const { score, breakdown } = computeScore({
    brandMentioned: brand.total > 0,
    brandFirstPosition: brand.firstPosition,
    competitorCountMentioned,
    hasOwnedCitation,
    responseLength: normalisedText.length,
  });

  const recommendations = generateRecommendations({
    brandMentioned: brand.total > 0,
    brandFirstPosition: brand.firstPosition,
    competitorCountMentioned,
    hasOwnedCitation,
    thirdPartyDomainCount,
    platform: input.platform ?? "unknown",
  });

  return {
    brandMentioned: brand.total > 0,
    brandMentionCount: brand.total,
    brandFirstPosition: brand.firstPosition,
    competitorCountMentioned,
    score,
    scoreBreakdown: breakdown,
    recommendations,
  };
}
