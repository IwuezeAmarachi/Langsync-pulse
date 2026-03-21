export type ScoreBreakdown = {
  brandMentioned: number;
  mentionedEarly: number;
  ownedCitation: number;
  competitorPenalty: number;
};

export type ScoreResult = {
  score: number;
  breakdown: ScoreBreakdown;
};

export function computeScore(args: {
  brandMentioned: boolean;
  brandFirstPosition: number | null;
  competitorCountMentioned: number;
  hasOwnedCitation: boolean;
  responseLength: number;
}): ScoreResult {
  const earlyThreshold = Math.min(300, args.responseLength * 0.2);

  const breakdown: ScoreBreakdown = {
    brandMentioned: args.brandMentioned ? 50 : 0,
    mentionedEarly:
      args.brandFirstPosition !== null && args.brandFirstPosition < earlyThreshold ? 10 : 0,
    ownedCitation: args.hasOwnedCitation ? 15 : 0,
    competitorPenalty:
      args.competitorCountMentioned > 0
        ? -Math.min(20, args.competitorCountMentioned * 5)
        : 0,
  };

  const raw = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const score = Math.max(0, Math.min(100, raw));

  return { score, breakdown };
}
