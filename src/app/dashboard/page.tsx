"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { POST_STATUS_LABELS, POST_TYPE_LABELS, ALL_STATUSES, ALL_POST_TYPES } from "@/lib/constants";
import { DashboardStats, PostStatus, PostType, Post, Notification } from "@/lib/types";
import { useUser } from "@/providers/user-provider";

// ─── Super Admin / Reviewer Dashboard ────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats);
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
                    <div className="w-40"><PostStatusBadge status={status as PostStatus} /></div>
                    <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
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
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
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
              <p className="text-sm text-muted-foreground">No posts created yet.</p>
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

// ─── Employee Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const { currentUser } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]).then(([postsData, notifData]) => {
      setPosts(postsData);
      setNotifications(notifData.notifications || []);
      setLoading(false);
    });
  }, [currentUser]);

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <Link href="/posts/new">
          <Button>Create New Post</Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{posts.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{statusCounts["draft"] || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{(statusCounts["submitted"] || 0) + (statusCounts["under_review"] || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{statusCounts["published"] || 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Posts</CardTitle>
            <Link href="/posts"><Button variant="outline" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse bg-muted rounded" />)}</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No posts yet.</p>
                <Link href="/posts/new"><Button size="sm">Create Your First Post</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.slice(0, 5).map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium truncate flex-1 mr-3">{post.title}</span>
                    <PostStatusBadge status={post.status as PostStatus} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications / Reviewer Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Reviewer Feedback
              {unread.length > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unread.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? "bg-muted/30" : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-muted-foreground" : "bg-yellow-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {n.post_id && (
                      <Link href={`/posts/${n.post_id}`}><Button variant="outline" size="sm">View</Button></Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Tracking */}
      {posts.some((p) => p.status === "changes_requested") && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Action Required — Changes Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {posts.filter((p) => p.status === "changes_requested").map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <span className="text-sm font-medium">{post.title}</span>
                  <Button variant="outline" size="sm">Review & Edit</Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Root Dashboard — picks the right view by role ───────────────────────────
export default function DashboardPage() {
  const { authRole, loading } = useUser();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (authRole === "employee") return <EmployeeDashboard />;
  return <AdminDashboard />;
}
