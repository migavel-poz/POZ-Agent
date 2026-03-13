"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { VALID_TRANSITIONS, POST_STATUS_LABELS } from "@/lib/constants";
import { Post, PostRevision, PostStatusHistory, PostStatus, PostType, TeamMember } from "@/lib/types";
import { toast } from "sonner";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, teamMembers } = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [statusHistory, setStatusHistory] = useState<PostStatusHistory[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [designerId, setDesignerId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const designers = teamMembers.filter((m) => m.role === "designer");

  useEffect(() => {
    fetchPost();
    fetchRevisions();
    fetchStatusHistory();
  }, [id]);

  const fetchPost = () => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((data: Post) => {
        setPost(data);
        setContent(data.content);
        setTitle(data.title);
        setScheduledDate(data.scheduled_date || "");
        setDesignerId(data.assigned_designer_id?.toString() || "");
        setNotes(data.notes || "");
      });
  };

  const fetchRevisions = () => {
    fetch(`/api/posts/${id}/revisions`).then((r) => r.json()).then(setRevisions);
  };

  const fetchStatusHistory = () => {
    // We'll fetch from a combined endpoint or just track locally
    setStatusHistory([]);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          scheduled_date: scheduledDate || null,
          assigned_designer_id: designerId ? Number(designerId) : null,
          notes: notes || null,
        }),
      });

      if (content !== post?.content) {
        await fetch(`/api/posts/${id}/revisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, revised_by: currentUser.id, revision_type: "manual_edit" }),
        });
        fetchRevisions();
      }

      toast.success("Post saved!");
      fetchPost();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (newStatus: PostStatus) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changed_by: currentUser.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`Moved to ${POST_STATUS_LABELS[newStatus]}`);
      fetchPost();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to transition");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    toast.success("Post deleted");
    router.push("/posts");
  };

  if (!post) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const nextStatuses = VALID_TRANSITIONS[post.status as PostStatus] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/posts")}>Back</Button>
          <h2 className="text-xl font-bold">{post.title}</h2>
          <PostTypeBadge type={post.post_type as PostType} />
          <PostStatusBadge status={post.status as PostStatus} />
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Post Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  className="font-mono text-sm"
                />
              </div>

              {post.post_type === "carousel" && post.carousel_slides && (
                <div className="space-y-2">
                  <Label>Carousel Slides</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      try {
                        const parsed = JSON.parse(post.carousel_slides);
                        const slides = parsed.slides || [];
                        return slides.map((slide: { headline: string; bodyText: string }, i: number) => (
                          <Card key={i} className="p-3">
                            <p className="text-xs text-muted-foreground">Slide {i + 1}</p>
                            <p className="font-semibold text-sm">{slide.headline}</p>
                            <p className="text-xs text-muted-foreground mt-1">{slide.bodyText}</p>
                          </Card>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              )}

              {post.hashtags && (
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    try {
                      return JSON.parse(post.hashtags).map((tag: string) => (
                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="revisions">
            <TabsList>
              <TabsTrigger value="revisions">Revisions ({revisions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="revisions">
              <Card>
                <CardContent className="pt-6">
                  {revisions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No revisions yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {revisions.map((rev) => (
                        <div key={rev.id} className="border-l-2 pl-4 py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{rev.revised_by_name}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{rev.revision_type}</span>
                            <span className="text-xs text-muted-foreground">{new Date(rev.created_at).toLocaleString()}</span>
                          </div>
                          <pre className="text-xs mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-muted-foreground">
                            {rev.content.substring(0, 200)}...
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current Status</Label>
                <div className="mt-1"><PostStatusBadge status={post.status as PostStatus} /></div>
              </div>
              {nextStatuses.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Move to:</Label>
                  <div className="flex flex-col gap-2">
                    {nextStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransition(status)}
                        className="justify-start"
                      >
                        {POST_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Author</Label>
                <p className="text-sm font-medium">{post.author_name}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Assign Designer</Label>
                <Select value={designerId} onValueChange={setDesignerId}>
                  <SelectTrigger><SelectValue placeholder="Select designer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {designers.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes, feedback..."
                />
              </div>

              {post.ai_prompt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">AI Prompt Used</Label>
                    <p className="text-sm mt-1">{post.ai_prompt}</p>
                  </div>
                </>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
