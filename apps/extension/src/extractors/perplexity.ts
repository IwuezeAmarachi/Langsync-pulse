import type { PlatformExtractor, ExtractedPayload } from "./types";

export const perplexityExtractor: PlatformExtractor = {
  platform: "perplexity",

  canHandle(url: string): boolean {
    return url.includes("perplexity.ai");
  },

  isResponseReady(doc: Document): boolean {
    const answer = doc.querySelector('[class*="answer"]');
    const spinner = doc.querySelector('[class*="spinner"], [class*="loading"]');
    return !!answer && !spinner;
  },

  extract(doc: Document): ExtractedPayload | null {
    const queryEl = doc.querySelector('textarea, [class*="query-input"]');
    const answerEl = doc.querySelector('[class*="prose"], [class*="answer"]');

    if (!answerEl) return null;

    const promptText = queryEl?.textContent?.trim() ?? "";
    const responseText = answerEl.textContent?.trim() ?? "";

    if (!responseText) return null;

    const sourceEls = doc.querySelectorAll('[class*="source"] a, [class*="citation"] a');
    const citations: Array<{ url: string; label?: string }> = [];
    sourceEls.forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const label = a.textContent?.trim();
      if (href.startsWith("http")) {
        citations.push({ url: href, label: label || undefined });
      }
    });

    return {
      platform: "perplexity",
      promptText,
      responseText,
      citations,
      capturedAt: new Date().toISOString(),
      pageUrl: location.href,
    };
  },
};
