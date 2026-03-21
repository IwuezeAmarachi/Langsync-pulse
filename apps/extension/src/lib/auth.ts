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

export function openDashboardLogin(): void {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/login?source=extension` });
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}
