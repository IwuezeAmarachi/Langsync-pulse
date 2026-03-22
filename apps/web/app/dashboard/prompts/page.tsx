"use client";

import { useState, KeyboardEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

type PromptRow = {
  id: string;
  promptText: string;
  category: string | null;
  priority: string;
  latestScore: number | null;
  captureCount: number;
  trend: Array<{ score: number; date: string }>;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>;
  const variant = score >= 65 ? "default" : score >= 40 ? "secondary" : "destructive";
  return <Badge variant={variant}>{score}</Badge>;
}

function Sparkline({ data }: { data: Array<{ score: number }> }) {
  if (!data.length) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="score" strokeWidth={1.5} dot={false} className="stroke-primary" />
        <Tooltip contentStyle={{ fontSize: 11, padding: "2px 6px" }} formatter={(v) => [v as number, "score"]} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PromptsPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<{ prompts: PromptRow[] }>({
    queryKey: ["dashboard-prompts", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/prompts`);
      return res.json();
    },
    enabled: !!workspace,
  });

  async function handleAddPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!promptText.trim() || !workspace) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: promptText.trim() }),
      });
      setPromptText("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["dashboard-prompts", workspace.id] });
    } finally {
      setSaving(false);
    }
  }

  const loading = wsLoading || isLoading;
  const prompts = data?.prompts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prompts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tracked queries and their visibility scores over time
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          + Add prompt
        </button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleAddPrompt} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Prompt text</label>
                <input
                  autoFocus
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder='e.g. "best CRM for B2B startups"'
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Escape" && setShowForm(false)}
                />
              </div>
              <button
                type="submit"
                disabled={saving || !promptText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted-foreground border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All prompts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Latest score</TableHead>
                <TableHead className="text-right">Captures</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No prompts yet.{" "}
                    <button onClick={() => setShowForm(true)} className="underline">
                      Add your first prompt
                    </button>{" "}
                    to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                prompts.map((p: PromptRow) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm font-medium">{p.promptText}</p>
                    </TableCell>
                    <TableCell>
                      {p.category ? (
                        <Badge variant="outline">{p.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize text-sm">{p.priority}</TableCell>
                    <TableCell className="text-right"><ScoreBadge score={p.latestScore} /></TableCell>
                    <TableCell className="text-right text-sm">{p.captureCount}</TableCell>
                    <TableCell><Sparkline data={p.trend} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
