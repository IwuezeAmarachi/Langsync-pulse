import type { CapturePayload } from "@langsync/shared-types";
import { getExtractor } from "./extractors/registry";
import { getWorkspaceId } from "./lib/auth";

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type !== "LANGSYNC_TRIGGER_CAPTURE") return;

  const extractor = getExtractor(location.href);
  if (!extractor) {
    chrome.runtime.sendMessage({ type: "LANGSYNC_ERROR", error: "Unsupported platform" });
    return;
  }

  if (!extractor.isResponseReady(document)) {
    chrome.runtime.sendMessage({ type: "LANGSYNC_ERROR", error: "Response not ready yet" });
    return;
  }

  const extracted = extractor.extract(document);
  if (!extracted) {
    chrome.runtime.sendMessage({ type: "LANGSYNC_ERROR", error: "Extraction failed" });
    return;
  }

  // Resolve workspaceId from storage before building the payload
  getWorkspaceId().then((workspaceId) => {
    if (!workspaceId) {
      chrome.runtime.sendMessage({ type: "LANGSYNC_ERROR", error: "Not authenticated" });
      return;
    }

    const payload: CapturePayload = {
      workspaceId,
      platform: extracted.platform,
      promptText: extracted.promptText,
      responseText: extracted.responseText,
      citations: extracted.citations,
      capturedAt: extracted.capturedAt,
      pageUrl: extracted.pageUrl,
      captureMode: "manual",
    };

    chrome.runtime.sendMessage({ type: "LANGSYNC_CAPTURE", payload });
  });
});
