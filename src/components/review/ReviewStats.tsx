"use client";

import { useReviewStatus } from "@/hooks/use-review-status";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, SkipForward, AlertCircle } from "lucide-react";

export function ReviewStats() {
  const { data, isLoading, error } = useReviewStatus();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data?.success || !data?.data) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load review stats</span>
        </CardContent>
      </Card>
    );
  }

  const stats = data.data;
  const lastSyncText = stats.lastSync
    ? new Date(stats.lastSync).toLocaleString()
    : "Never";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span>Unreviewed</span>
          </div>
          <p className="text-2xl font-bold">{stats.unreviewed}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Shared</span>
          </div>
          <p className="text-2xl font-bold">{stats.shared}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <SkipForward className="h-4 w-4 text-blue-500" />
            <span>Skipped</span>
          </div>
          <p className="text-2xl font-bold">{stats.skipped}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span>Last Sync</span>
          </div>
          <p className="text-sm font-medium truncate" title={lastSyncText}>
            {lastSyncText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
