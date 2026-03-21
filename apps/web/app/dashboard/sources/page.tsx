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

type SourceRow = {
  domain: string;
  count: number;
  sourceType: string;
};

const SOURCE_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  owned: "default",
  competitor: "destructive",
  "third-party": "secondary",
  unknown: "outline",
};

export default function SourcesPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();

  const { data, isLoading } = useQuery<{ sources: SourceRow[] }>({
    queryKey: ["dashboard-sources", workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace!.id}/dashboard/sources`);
      return res.json();
    },
    enabled: !!workspace,
  });

  const loading = wsLoading || isLoading;
  const sources = data?.sources ?? [];
  const maxCount = sources[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Domains cited most often in AI responses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top citation domains</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Citations</TableHead>
                <TableHead className="w-48">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No citations yet. Capture some prompts to see source data.
                  </TableCell>
                </TableRow>
              ) : (
                sources.map((s: SourceRow, i: number) => (
                  <TableRow key={s.domain}>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <a
                        href={`https://${s.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                      >
                        {s.domain}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={SOURCE_TYPE_VARIANTS[s.sourceType] ?? "outline"}>
                        {s.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{s.count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {Math.round((s.count / maxCount) * 100)}%
                        </span>
                      </div>
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
