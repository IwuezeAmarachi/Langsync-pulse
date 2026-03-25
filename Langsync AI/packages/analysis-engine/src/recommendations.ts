import type { AnalysisResult } from "@langsync/shared-types";

type RecommendationInput = {
  brandMentioned: boolean;
  brandFirstPosition: number | null;
  competitorCountMentioned: number;
  hasOwnedCitation: boolean;
  thirdPartyDomainCount: number;
  platform: string;
};

export function generateRecommendations(
  input: RecommendationInput
): AnalysisResult["recommendations"] {
  const recs: AnalysisResult["recommendations"] = [];

  if (!input.brandMentioned && input.competitorCountMentioned > 0) {
    recs.push({
      ruleKey: "brand_absent_competitor_present",
      priority: "high",
      message:
        "Brand is absent while competitors appear. Expand intent-aligned content and entity coverage.",
    });
  }

  if (!input.brandMentioned && !input.hasOwnedCitation) {
    recs.push({
      ruleKey: "brand_absent_no_citation",
      priority: "high",
      message: "Brand is absent with no owned citations. Review content strategy for this prompt.",
    });
  }

  if (input.brandMentioned && !input.hasOwnedCitation) {
    recs.push({
      ruleKey: "brand_present_no_owned_citation",
      priority: "medium",
      message:
        "Brand is mentioned but no owned domain is cited. Improve citation-eligible pages.",
    });
  }

  if (input.thirdPartyDomainCount > 3 && !input.hasOwnedCitation) {
    recs.push({
      ruleKey: "third_party_domains_dominate",
      priority: "medium",
      message:
        "Third-party domains dominate citations. Consider targeted PR and listicle outreach.",
    });
  }

  if (input.brandFirstPosition !== null && input.brandFirstPosition > 500) {
    recs.push({
      ruleKey: "late_brand_mention",
      priority: "low",
      message:
        "Brand appears late in the response. Work on improving entity prominence in source content.",
    });
  }

  return recs;
}
