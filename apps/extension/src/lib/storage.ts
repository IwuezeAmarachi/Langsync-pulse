export type PendingCapture = {
  id: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: number;
};

const PENDING_KEY = "langsync_pending";
const AUTH_KEY = "langsync_auth";
const PREFS_KEY = "langsync_prefs";

export const storage = {
  async getPending(): Promise<PendingCapture[]> {
    const result = await chrome.storage.local.get(PENDING_KEY);
    return (result[PENDING_KEY] as PendingCapture[]) ?? [];
  },

  async addPending(capture: PendingCapture): Promise<void> {
    const existing = await storage.getPending();
    await chrome.storage.local.set({ [PENDING_KEY]: [...existing, capture] });
  },

  async removePending(id: string): Promise<void> {
    const existing = await storage.getPending();
    await chrome.storage.local.set({
      [PENDING_KEY]: existing.filter((c) => c.id !== id),
    });
  },

  async getAuth(): Promise<{ token: string; workspaceId: string } | null> {
    const result = await chrome.storage.local.get(AUTH_KEY);
    return (result[AUTH_KEY] as { token: string; workspaceId: string }) ?? null;
  },

  async setAuth(auth: { token: string; workspaceId: string }): Promise<void> {
    await chrome.storage.local.set({ [AUTH_KEY]: auth });
  },

  async clearAuth(): Promise<void> {
    await chrome.storage.local.remove(AUTH_KEY);
  },

  async getPrefs(): Promise<Record<string, boolean>> {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return (result[PREFS_KEY] as Record<string, boolean>) ?? {};
  },

  async setPrefs(prefs: Record<string, boolean>): Promise<void> {
    await chrome.storage.local.set({ [PREFS_KEY]: prefs });
  },
};
