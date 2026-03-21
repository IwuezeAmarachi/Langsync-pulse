"use client";

import { useQuery } from "@tanstack/react-query";
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
  const variant =
    score >= 65 ? "default" : score >= 40 ? "secondary" : "destructive";
  return <Badge variant={variant}>{score}</Badge>;
}

function Sparkline({ data }: { data: Array<{ score: number }> }) {
  if (!data.length) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="score"
          strokeWidth={1.5}
          dot={false}
          className="stroke-primary"
        />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: "2px 6px" }}
          formatter={(v) => [v as number, "score"]}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PromptsPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();

  const { data, isLoading } = useQuery<{ prompts: PromptRow[] }>({
    queryKey: ["dashboard-prompts", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/prompts`);
      return res.json();
    },
    enabled: !!workspace,
  });

  const loading = wsLoading || isLoading;
  const prompts = data?.prompts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prompts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tracked queries and their visibility scores over time
        </p>
      </div>

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
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No prompts yet. Add prompts via the API to start tracking.
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
                    <TableCell className="text-right">
                      <ScoreBadge score={p.latestScore} />
                    </TableCell>
                    <TableCell className="text-right text-sm">{p.captureCount}</TableCell>
                    <TableCell>
                      <Sparkline data={p.trend} />
                    </TableCell>
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
