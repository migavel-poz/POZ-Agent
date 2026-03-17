"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { POST_STATUS_LABELS } from "@/lib/constants";
import { Post, PostStatus } from "@/lib/types";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function DesignPage() {
  const { authRole, currentUser, loading } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && authRole !== "designer" && authRole !== "admin" && authRole !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [authRole, loading, router]);

  const fetchPosts = () => {
    setFetching(true);
    // Fetch all posts in design-related statuses
    const statusesToFetch: PostStatus[] = ["approved_for_design", "design_in_progress", "ready_to_publish"];
    Promise.all(
      statusesToFetch.map((s) => fetch(`/api/posts?status=${s}`).then((r) => r.json()))
    ).then(([approved, inProgress, ready]) => {
      setPosts([...approved, ...inProgress, ...ready]);
      setFetching(false);
    }).catch(() => setFetching(false));
  };

  useEffect(() => {
    if (authRole === "designer" || authRole === "admin" || authRole === "superadmin") fetchPosts();
  }, [authRole]);

  const handleTransition = async (postId: number, newStatus: PostStatus) => {
    if (!currentUser) return;
    setTransitioning(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changed_by: currentUser.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`Post moved to ${POST_STATUS_LABELS[newStatus]}`);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTransitioning(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Design Queue</h2>
        {[1, 2].map((i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-24 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const designQueue = posts.filter((p) => p.status === "approved_for_design");
  const inProgress = posts.filter((p) => p.status === "design_in_progress");
  const readyToPublish = posts.filter((p) => p.status === "ready_to_publish");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Design Queue</h2>
        <p className="text-muted-foreground">
          {designQueue.length} in queue · {inProgress.length} in progress · {readyToPublish.length} ready to publish
        </p>
      </div>

      {/* Design Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Design Queue
            {designQueue.length > 0 && (
              <span className="text-sm font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{designQueue.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {designQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts waiting for design.</p>
          ) : (
            <div className="space-y-3">
              {designQueue.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PostTypeBadge type={post.post_type} />
                    <div className="min-w-0">
                      <Link href={`/posts/${post.id}`} className="text-sm font-medium hover:underline truncate block">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">by {post.author_name} · {new Date(post.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <PostStatusBadge status={post.status as PostStatus} />
                    <Button
                      size="sm"
                      disabled={transitioning === post.id}
                      onClick={() => handleTransition(post.id, "design_in_progress")}
                    >
                      Start Design
                    </Button>
                    <Link href={`/posts/${post.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Progress Designs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            In Progress Designs
            {inProgress.length > 0 && (
              <span className="text-sm font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{inProgress.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">No designs in progress.</p>
          ) : (
            <div className="space-y-3">
              {inProgress.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PostTypeBadge type={post.post_type} />
                    <div className="min-w-0">
                      <Link href={`/posts/${post.id}`} className="text-sm font-medium hover:underline truncate block">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">by {post.author_name} · {new Date(post.updated_at).toLocaleDateString()}</p>
                      {post.designer_name && (
                        <p className="text-xs text-purple-600">Assigned to: {post.designer_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <PostStatusBadge status={post.status as PostStatus} />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={transitioning === post.id}
                      onClick={() => handleTransition(post.id, "approved_for_design")}
                    >
                      Back to Queue
                    </Button>
                    <Button
                      size="sm"
                      disabled={transitioning === post.id}
                      onClick={() => handleTransition(post.id, "ready_to_publish")}
                    >
                      Mark Ready to Publish
                    </Button>
                    <Link href={`/posts/${post.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready for Publish */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ready for Publish
            {readyToPublish.length > 0 && (
              <span className="text-sm font-normal bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{readyToPublish.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readyToPublish.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts ready to publish yet.</p>
          ) : (
            <div className="space-y-3">
              {readyToPublish.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PostTypeBadge type={post.post_type} />
                    <div className="min-w-0">
                      <Link href={`/posts/${post.id}`} className="text-sm font-medium hover:underline truncate block">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">by {post.author_name} · {new Date(post.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <PostStatusBadge status={post.status as PostStatus} />
                    <Link href={`/posts/${post.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
