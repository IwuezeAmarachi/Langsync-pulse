import type { PlatformExtractor } from "./types";
import { chatgptExtractor } from "./chatgpt";
import { perplexityExtractor } from "./perplexity";
import { geminiExtractor } from "./gemini";

const extractors: PlatformExtractor[] = [
  chatgptExtractor,
  perplexityExtractor,
  geminiExtractor,
];

export function getExtractor(url: string): PlatformExtractor | null {
  return extractors.find((e) => e.canHandle(url)) ?? null;
}
