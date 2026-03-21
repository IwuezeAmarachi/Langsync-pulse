import type { PlatformExtractor, ExtractedPayload } from "./types";

export const chatgptExtractor: PlatformExtractor = {
  platform: "chatgpt",

  canHandle(url: string): boolean {
    return url.includes("chatgpt.com");
  },

  isResponseReady(doc: Document): boolean {
    const streamingIndicator = doc.querySelector('[data-testid="stop-button"]');
    const responseBlocks = doc.querySelectorAll('[data-message-author-role="assistant"]');
    return !streamingIndicator && responseBlocks.length > 0;
  },

  extract(doc: Document): ExtractedPayload | null {
    const turns = doc.querySelectorAll("[data-message-author-role]");
    if (!turns.length) return null;

    let promptText = "";
    let responseText = "";

    turns.forEach((el) => {
      const role = el.getAttribute("data-message-author-role");
      if (role === "user") {
        promptText = el.textContent?.trim() ?? "";
      } else if (role === "assistant") {
        responseText = el.textContent?.trim() ?? "";
      }
    });

    if (!promptText || !responseText) return null;

    const linkEls = doc.querySelectorAll('[data-message-author-role="assistant"] a[href]');
    const citations: Array<{ url: string; label?: string }> = [];
    linkEls.forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const label = a.textContent?.trim();
      if (href.startsWith("http")) {
        citations.push({ url: href, label: label || undefined });
      }
    });

    return {
      platform: "chatgpt",
      promptText,
      responseText,
      citations,
      capturedAt: new Date().toISOString(),
      pageUrl: location.href,
    };
  },
};
