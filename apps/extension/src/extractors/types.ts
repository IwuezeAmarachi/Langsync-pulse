export interface ExtractedPayload {
  platform: "chatgpt" | "perplexity" | "gemini";
  promptText: string;
  responseText: string;
  citations: Array<{ url: string; label?: string }>;
  capturedAt: string;
  pageUrl: string;
}

export interface PlatformExtractor {
  platform: ExtractedPayload["platform"];
  canHandle(url: string): boolean;
  isResponseReady(doc: Document): boolean;
  extract(doc: Document): ExtractedPayload | null;
}
