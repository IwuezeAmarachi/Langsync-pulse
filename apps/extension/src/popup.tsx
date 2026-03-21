import { useEffect, useState } from "react";
import { isAuthenticated, getWorkspaceId, openDashboardLogin, openDashboard, signOut } from "./lib/auth";

type Status =
  | { kind: "checking" }
  | { kind: "unauthenticated" }
  | { kind: "ready"; platform: string }
  | { kind: "unsupported" }
  | { kind: "capturing" }
  | { kind: "success"; captureId: string }
  | { kind: "error"; message: string };

const SUPPORTED = ["chatgpt.com", "perplexity.ai", "gemini.google.com"];

function getPlatformLabel(url: string): string | null {
  if (url.includes("chatgpt.com")) return "ChatGPT";
  if (url.includes("perplexity.ai")) return "Perplexity";
  if (url.includes("gemini.google.com")) return "Gemini";
  return null;
}

export default function IndexPopup() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const authed = await isAuthenticated();
      if (!authed) {
        setStatus({ kind: "unauthenticated" });
        return;
      }

      const wsId = await getWorkspaceId();
      setWorkspaceId(wsId);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab.url ?? "";
      const platform = getPlatformLabel(url);

      if (!platform) {
        setStatus({ kind: "unsupported" });
      } else {
        setStatus({ kind: "ready", platform });
      }
    }

    init();

    // Listen for responses from background
    const listener = (msg: { type: string; captureId?: string; error?: string }) => {
      if (msg.type === "LANGSYNC_CAPTURE_COMPLETE" && msg.captureId) {
        setStatus({ kind: "success", captureId: msg.captureId });
      }
      if (msg.type === "LANGSYNC_CAPTURE_FAILED") {
        setStatus({ kind: "error", message: msg.error ?? "Capture failed" });
      }
      if (msg.type === "LANGSYNC_ERROR") {
        setStatus({ kind: "error", message: msg.error ?? "Unknown error" });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function triggerCapture() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    setStatus({ kind: "capturing" });
    chrome.tabs.sendMessage(tab.id, { type: "LANGSYNC_TRIGGER_CAPTURE" });
  }

  async function handleSignOut() {
    await signOut();
    setStatus({ kind: "unauthenticated" });
    setWorkspaceId(null);
  }

  return (
    <main style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>LangSync Pulse</span>
        {status.kind !== "unauthenticated" && status.kind !== "checking" && (
          <button style={styles.textBtn} onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </div>

      <div style={styles.body}>
        {status.kind === "checking" && (
          <p style={styles.muted}>Loading…</p>
        )}

        {status.kind === "unauthenticated" && (
          <>
            <p style={styles.muted}>Sign in to start tracking AI visibility.</p>
            <button style={styles.primaryBtn} onClick={openDashboardLogin}>
              Sign in
            </button>
          </>
        )}

        {status.kind === "unsupported" && (
          <>
            <p style={styles.muted}>
              Navigate to <strong>ChatGPT</strong>, <strong>Perplexity</strong>, or{" "}
              <strong>Gemini</strong> to capture a response.
            </p>
            <button style={{ ...styles.textBtn, marginTop: 8 }} onClick={openDashboard}>
              Open dashboard ↗
            </button>
          </>
        )}

        {status.kind === "ready" && (
          <>
            <div style={styles.platformBadge}>{status.platform}</div>
            <p style={styles.muted}>Ask a question, wait for the response, then capture.</p>
            <button style={styles.primaryBtn} onClick={triggerCapture}>
              Capture response
            </button>
            {workspaceId && (
              <button
                style={{ ...styles.textBtn, marginTop: 6 }}
                onClick={openDashboard}
              >
                View dashboard ↗
              </button>
            )}
          </>
        )}

        {status.kind === "capturing" && (
          <p style={styles.muted}>Capturing…</p>
        )}

        {status.kind === "success" && (
          <>
            <div style={styles.successIcon}>✓</div>
            <p style={{ ...styles.muted, textAlign: "center" }}>
              Captured and queued for analysis.
            </p>
            <button style={styles.textBtn} onClick={openDashboard}>
              View in dashboard ↗
            </button>
          </>
        )}

        {status.kind === "error" && (
          <>
            <p style={styles.errorText}>{status.message}</p>
            <button
              style={styles.primaryBtn}
              onClick={() =>
                setStatus(
                  workspaceId ? { kind: "ready", platform: "Unknown" } : { kind: "unauthenticated" }
                )
              }
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minWidth: 280,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 13,
    color: "#111",
    backgroundColor: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px 10px",
    borderBottom: "1px solid #eee",
  },
  logo: {
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "-0.01em",
  },
  body: {
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 100,
  },
  muted: {
    color: "#555",
    margin: 0,
    lineHeight: 1.5,
  },
  primaryBtn: {
    padding: "8px 14px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    width: "100%",
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: 12,
    padding: 0,
    textAlign: "center" as const,
  },
  platformBadge: {
    display: "inline-block",
    padding: "3px 8px",
    background: "#f4f4f5",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    color: "#444",
    width: "fit-content",
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#22c55e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    margin: "0 auto",
  },
  errorText: {
    color: "#ef4444",
    margin: 0,
    fontSize: 12,
  },
};
