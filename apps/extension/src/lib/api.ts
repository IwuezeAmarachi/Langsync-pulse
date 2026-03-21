import { storage } from "./storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:3000";
const MAX_RETRIES = 3;

type CapturePayload = {
  workspaceId: string;
  platform: string;
  promptText: string;
  responseText: string;
  citations: Array<{ url: string; label?: string }>;
  capturedAt: string;
  pageUrl: string;
  captureMode: string;
};

async function post(path: string, body: unknown, token: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function submitCapture(
  payload: CapturePayload
): Promise<{ captureId: string } | null> {
  const auth = await storage.getAuth();
  if (!auth) return null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await post("/api/captures", payload, auth.token);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      const delay = Math.pow(2, attempt) * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  await storage.addPending({
    id: crypto.randomUUID(),
    payload: payload as Record<string, unknown>,
    attempts: MAX_RETRIES,
    createdAt: Date.now(),
  });

  return null;
}

export async function flushPendingCaptures(): Promise<void> {
  const pending = await storage.getPending();
  const auth = await storage.getAuth();
  if (!auth || !pending.length) return;

  for (const item of pending) {
    try {
      const res = await post("/api/captures", item.payload, auth.token);
      if (res.ok) {
        await storage.removePending(item.id);
      }
    } catch {
      // Leave in queue for next flush
    }
  }
}
