import type { CapturePayload } from "@langsync/shared-types";
import { submitCapture, flushPendingCaptures } from "./lib/api";
import { storage } from "./lib/storage";

// Flush any captures that failed to send in a previous session
flushPendingCaptures();

type IncomingMessage =
  | { type: "LANGSYNC_CAPTURE"; payload: CapturePayload }
  | { type: "LANGSYNC_AUTH"; token: string; workspaceId: string }
  | { type: "LANGSYNC_SIGN_OUT" }
  | { type: "LANGSYNC_ERROR"; error: string };

chrome.runtime.onMessage.addListener((message: IncomingMessage) => {
  switch (message.type) {
    case "LANGSYNC_CAPTURE":
      submitCapture(message.payload).then((result) => {
        chrome.runtime.sendMessage(
          result
            ? { type: "LANGSYNC_CAPTURE_COMPLETE", captureId: result.captureId }
            : { type: "LANGSYNC_CAPTURE_FAILED", error: "Failed to submit capture" }
        );
      });
      break;

    case "LANGSYNC_AUTH":
      storage.setAuth({ token: message.token, workspaceId: message.workspaceId }).then(() => {
        // Flush any pending captures now that we have credentials
        flushPendingCaptures();
      });
      break;

    case "LANGSYNC_SIGN_OUT":
      storage.clearAuth();
      break;

    case "LANGSYNC_ERROR":
      console.warn("[LangSync] Content error:", message.error);
      break;
  }
});
