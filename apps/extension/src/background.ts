import type { CapturePayload } from "@langsync/shared-types";
import { submitCapture, flushPendingCaptures } from "./lib/api";

// Flush any captures that failed to send in a previous session
flushPendingCaptures();

chrome.runtime.onMessage.addListener(
  (message: { type: string; payload?: CapturePayload; error?: string }) => {
    if (message.type === "LANGSYNC_CAPTURE" && message.payload) {
      submitCapture(message.payload).then((result) => {
        if (result) {
          chrome.runtime.sendMessage({
            type: "LANGSYNC_CAPTURE_COMPLETE",
            captureId: result.captureId,
          });
        }
      });
    }

    if (message.type === "LANGSYNC_ERROR") {
      console.warn("[LangSync] Content error:", message.error);
    }
  }
);
