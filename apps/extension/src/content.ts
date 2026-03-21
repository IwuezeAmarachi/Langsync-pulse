import type { CapturePayload } from "@langsync/shared-types";
import { getExtractor } from "./extractors/registry";

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

  const payload: CapturePayload = {
    workspaceId: "ws_demo", // TODO: replace with storage.getAuth() after auth flow is wired
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
