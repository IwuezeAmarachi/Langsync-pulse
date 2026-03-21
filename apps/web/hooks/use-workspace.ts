"use client";

import { useQuery } from "@tanstack/react-query";

type Workspace = { id: string; name: string };

async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch("/api/workspaces");
  if (!res.ok) throw new Error("Failed to fetch workspaces");
  const data = await res.json();
  return data.workspaces;
}

export function useWorkspace() {
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
  });

  const workspace = data?.[0] ?? null;
  return { workspace, isLoading };
}
