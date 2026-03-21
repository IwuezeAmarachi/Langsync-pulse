import type { PlatformExtractor, ExtractedPayload } from "./types";

export const geminiExtractor: PlatformExtractor = {
  platform: "gemini",

  canHandle(url: string): boolean {
    return url.includes("gemini.google.com");
  },

  isResponseReady(doc: Document): boolean {
    const response = doc.querySelector('model-response, [class*="response-container"]');
    const loading = doc.querySelector('[class*="loading"], [aria-label*="loading" i]');
    return !!response && !loading;
  },

  extract(doc: Document): ExtractedPayload | null {
    const queryEl = doc.querySelector('.query-text, [class*="query"]');
    const responseEl = doc.querySelector('model-response, [class*="response-content"]');

    if (!responseEl) return null;

    const promptText = queryEl?.textContent?.trim() ?? "";
    const responseText = responseEl.textContent?.trim() ?? "";

    if (!responseText) return null;

    const linkEls = responseEl.querySelectorAll("a[href]");
    const citations: Array<{ url: string; label?: string }> = [];
    linkEls.forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const label = a.textContent?.trim();
      if (href.startsWith("http")) {
        citations.push({ url: href, label: label || undefined });
      }
    });

    return {
      platform: "gemini",
      promptText,
      responseText,
      citations,
      capturedAt: new Date().toISOString(),
      pageUrl: location.href,
    };
  },
};
