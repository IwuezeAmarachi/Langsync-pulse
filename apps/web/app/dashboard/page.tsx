"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Overview = {
  totalAnalysed: number;
  averageScore: number;
  brandMentionRate: number;
  competitorWinRate: number;
};

type TrendPoint = { date: string; averageScore: number; count: number };

function StatCard({
  title,
  value,
  sub,
  loading,
}: {
  title: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();

  const { data: overview, isLoading: overviewLoading } = useQuery<Overview>({
    queryKey: ["dashboard-overview", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/overview`);
      return res.json();
    },
    enabled: !!workspace,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{ trends: TrendPoint[] }>({
    queryKey: ["dashboard-trends", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/trends?days=30`);
      return res.json();
    },
    enabled: !!workspace,
  });

  const loading = wsLoading || overviewLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI search visibility across all tracked prompts
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Average Score"
          value={overview ? `${overview.averageScore}` : "—"}
          sub="out of 100"
          loading={loading}
        />
        <StatCard
          title="Prompts Analysed"
          value={overview ? `${overview.totalAnalysed}` : "—"}
          loading={loading}
        />
        <StatCard
          title="Brand Mention Rate"
          value={overview ? `${Math.round(overview.brandMentionRate * 100)}%` : "—"}
          sub="of responses"
          loading={loading}
        />
        <StatCard
          title="Competitor Win Rate"
          value={overview ? `${Math.round(overview.competitorWinRate * 100)}%` : "—"}
          sub="competitor ahead of brand"
          loading={loading}
        />
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score trend — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading || wsLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (trendsData?.trends ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No data yet — capture some prompts to see trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendsData!.trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v) => [`${v}`, "Avg score"]}
                />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  strokeWidth={2}
                  dot={false}
                  className="stroke-primary"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
