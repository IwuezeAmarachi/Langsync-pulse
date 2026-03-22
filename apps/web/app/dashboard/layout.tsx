"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/prompts", label: "Prompts" },
  { href: "/dashboard/competitors", label: "Competitors" },
  { href: "/dashboard/sources", label: "Sources" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, isLoading } = useWorkspace();

  useEffect(() => {
    if (!isLoading && !workspace) {
      router.push("/onboarding");
    }
  }, [workspace, isLoading, router]);

  // Post auth token to window so the extension content script can pick it up
  useEffect(() => {
    if (!workspace) return;
    async function sendTokenToExtension() {
      try {
        const res = await fetch("/api/auth/token");
        if (!res.ok) return;
        const { token, workspaceId } = await res.json();
        if (token && workspaceId) {
          window.postMessage({ type: "LANGSYNC_AUTH_RESPONSE", token, workspaceId }, "*");
        }
      } catch {
        // Extension may not be installed — safe to ignore
      }
    }
    sendTokenToExtension();
  }, [workspace?.id]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r flex flex-col">
        <div className="px-5 py-4 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            LangSync Pulse
          </p>
          {workspace && (
            <p className="text-sm font-medium mt-0.5 truncate">{workspace.name}</p>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t flex items-center gap-2">
          <UserButton />
          <span className="text-xs text-muted-foreground">Account</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
