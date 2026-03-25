import { z } from "zod";

export const CitationSchema = z.object({
  url: z.string().url(),
  label: z.string().optional()
});

export const CapturePayloadSchema = z.object({
  workspaceId: z.string().min(1),
  platform: z.enum(["chatgpt", "perplexity", "gemini"]),
  promptText: z.string().min(1),
  responseText: z.string().min(1),
  citations: z.array(CitationSchema),
  capturedAt: z.string().datetime(),
  pageUrl: z.string().url(),
  captureMode: z.enum(["manual", "auto"])
});

export type Citation = z.infer<typeof CitationSchema>;
export type CapturePayload = z.infer<typeof CapturePayloadSchema>;

export type Competitor = {
  name: string;
  aliases: string[];
};

export type AnalysisResult = {
  brandMentioned: boolean;
  brandMentionCount: number;
  brandFirstPosition: number | null;
  competitorCountMentioned: number;
  score: number;
  scoreBreakdown: Record<string, number>;
  recommendations: Array<{ ruleKey: string; priority: "low" | "medium" | "high"; message: string }>;
};
