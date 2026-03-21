import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*", "https://*.langsync.com/*"],
  run_at: "document_idle",
};

/**
 * Listens for a postMessage from the dashboard page carrying the Clerk JWT
 * and relays it to the background service worker for storage.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "LANGSYNC_AUTH_RESPONSE") return;

  const { token, workspaceId } = event.data as { token: string; workspaceId: string };
  if (!token || !workspaceId) return;

  chrome.runtime.sendMessage({ type: "LANGSYNC_AUTH", token, workspaceId });
});
