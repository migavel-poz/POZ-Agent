"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { POST_STATUS_LABELS, POST_TYPE_LABELS, ALL_STATUSES, ALL_POST_TYPES } from "@/lib/constants";
import { DashboardStats, PostStatus, PostType } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.totalPosts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.postsThisWeek}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.inPipeline}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Published This Month</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.publishedThisMonth}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Pipeline Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ALL_STATUSES.map((status) => {
                const count = (stats.postsByStatus as Record<string, number>)[status] || 0;
                const maxCount = Math.max(...Object.values(stats.postsByStatus as Record<string, number>), 1);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-32"><PostStatusBadge status={status as PostStatus} /></div>
                    <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Posts by Type</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ALL_POST_TYPES.map((type) => {
                const count = (stats.postsByType as Record<string, number>)[type] || 0;
                const maxCount = Math.max(...Object.values(stats.postsByType as Record<string, number>), 1);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-36 text-sm font-medium">{POST_TYPE_LABELS[type as PostType]}</div>
                    <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Team Contributions</CardTitle></CardHeader>
          <CardContent>
            {stats.teamContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts created yet. Start by creating your first post!</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>Name</span><span className="text-center">Created</span><span className="text-center">Published</span>
                </div>
                {stats.teamContributions.map((tc) => (
                  <div key={tc.name} className="grid grid-cols-3 text-sm py-1">
                    <span className="font-medium">{tc.name}</span>
                    <span className="text-center">{tc.posts_created}</span>
                    <span className="text-center">{tc.posts_published}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium">{activity.changed_by_name}</span>{" "}
                      moved post to{" "}
                      <span className="font-medium">{POST_STATUS_LABELS[activity.to_status as PostStatus] || activity.to_status}</span>
                      <div className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
