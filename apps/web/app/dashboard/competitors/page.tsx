"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

  const { data, isLoading } = useQuery<{ competitors: CompetitorRow[] }>({
    queryKey: ["dashboard-competitors", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/competitors`);
      return res.json();
    },
    enabled: !!workspace,
  });

  const loading = wsLoading || isLoading;
  const competitors = data?.competitors ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Competitors</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How often competitors appear in AI responses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mention frequency</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No competitor mentions yet. Add competitors and capture some prompts.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={competitors} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v) => [v as number, "mentions"]}
                />
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

      {/* Table view */}
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
                      style={{
                        width: `${Math.round((c.count / competitors[0].count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 truncate">{c.name}</span>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {c.count} mentions
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
