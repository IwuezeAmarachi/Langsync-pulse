"use client";

import { useState, KeyboardEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

type CompetitorRow = { name: string; count: number };

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function CompetitorsPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [competitorName, setCompetitorName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<{ competitors: CompetitorRow[] }>({
    queryKey: ["dashboard-competitors", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/competitors`);
      return res.json();
    },
    enabled: !!workspace,
  });

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!competitorName.trim() || !workspace) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: competitorName.trim() }),
      });
      setCompetitorName("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["dashboard-competitors", workspace.id] });
    } finally {
      setSaving(false);
    }
  }

  const loading = wsLoading || isLoading;
  const competitors = data?.competitors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Competitors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            How often competitors appear in AI responses
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          + Add competitor
        </button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleAddCompetitor} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Competitor name</label>
                <input
                  autoFocus
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. HubSpot"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Escape" && setShowForm(false)}
                />
              </div>
              <button
                type="submit"
                disabled={saving || !competitorName.trim()}
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
          <CardTitle className="text-base">Mention frequency</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No competitor data yet.{" "}
              <button onClick={() => setShowForm(true)} className="underline">
                Add a competitor
              </button>{" "}
              and capture some prompts.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={competitors} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v as number, "mentions"]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {competitors.map((_: CompetitorRow, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {!loading && competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranked list</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competitors.map((c: CompetitorRow, i: number) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${Math.round((c.count / competitors[0].count) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 truncate">{c.name}</span>
                  <span className="text-sm text-muted-foreground w-16 text-right">{c.count} mentions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
