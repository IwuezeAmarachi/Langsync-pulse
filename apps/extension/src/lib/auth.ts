import { storage } from "./storage";

const DASHBOARD_URL = process.env.PLASMO_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";

export async function getAuthToken(): Promise<string | null> {
  const auth = await storage.getAuth();
  return auth?.token ?? null;
}

export async function getWorkspaceId(): Promise<string | null> {
  const auth = await storage.getAuth();
  return auth?.workspaceId ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

export function openDashboardLogin(): void {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/sign-in?source=extension` });
}

export function openDashboard(): void {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` });
}

export async function signOut(): Promise<void> {
  await storage.clearAuth();
  chrome.runtime.sendMessage({ type: "LANGSYNC_SIGN_OUT" });
}
