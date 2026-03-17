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
import { VALID_TRANSITIONS, POST_STATUS_LABELS, TRANSITION_ROLES } from "@/lib/constants";
import { Post, PostRevision, PostComment, PostStatus, PostType, TeamMember } from "@/lib/types";
import { toast } from "sonner";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, authRole } = useUser();
  const [teamMembers, setLocalTeamMembers] = useState<TeamMember[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [designerId, setDesignerId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const designers = teamMembers.filter((m) => m.role === "designer");
  const isEmployee = authRole === "employee";
  const isReviewer = authRole === "admin" || authRole === "superadmin";
  const isDesigner = authRole === "designer";

  useEffect(() => {
    fetchPost();
    fetchRevisions();
    fetchComments();
    fetch("/api/team").then((r) => r.json()).then((ms: TeamMember[]) => setLocalTeamMembers(ms));
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

  const fetchComments = () => {
    fetch(`/api/posts/${id}/comments`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setComments(data);
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    // Employees can only edit drafts or posts with changes_requested
    if (isEmployee && post && !["draft", "changes_requested"].includes(post.status)) {
      toast.error("You can only edit posts in Draft or Changes Requested state");
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          scheduled_date: scheduledDate || null,
          assigned_designer_id: designerId && designerId !== "none" ? Number(designerId) : null,
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

    // Validate role can perform this transition
    const transitionKey = `${post?.status}->${newStatus}`;
    const allowedRoles = TRANSITION_ROLES[transitionKey] || [];
    if (authRole && !allowedRoles.includes(authRole)) {
      toast.error(`Your role cannot perform this transition`);
      return;
    }

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

  const handleTransitionWithNote = async (newStatus: PostStatus) => {
    if (!currentUser) return;
    const note = window.prompt(`Add a note for "${POST_STATUS_LABELS[newStatus]}" (optional):`);
    if (note === null) return; // user cancelled

    const transitionKey = `${post?.status}->${newStatus}`;
    const allowedRoles = TRANSITION_ROLES[transitionKey] || [];
    if (authRole && !allowedRoles.includes(authRole)) {
      toast.error("Your role cannot perform this transition");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changed_by: currentUser.id, note: note || undefined }),
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

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_id: currentUser.id, content: newComment.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      setNewComment("");
      fetchComments();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!isReviewer) {
      toast.error("Only reviewers and admins can delete posts");
      return;
    }
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    toast.success("Post deleted");
    router.push("/posts");
  };

  if (!post) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const nextStatuses = (VALID_TRANSITIONS[post.status as PostStatus] || []).filter((s) => {
    const key = `${post.status}->${s}`;
    const allowed = TRANSITION_ROLES[key] || [];
    return authRole ? allowed.includes(authRole) : false;
  });

  // Statuses that warrant a note prompt (reviewer actions)
  const noteStatuses: PostStatus[] = ["changes_requested"];

  const canEdit = isReviewer || (isEmployee && ["draft", "changes_requested"].includes(post.status));
  const canAssignDesigner = isReviewer;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
          <h2 className="text-xl font-bold">{post.title}</h2>
          <PostTypeBadge type={post.post_type as PostType} />
          <PostStatusBadge status={post.status as PostStatus} />
        </div>
        <div className="flex gap-2">
          {(isReviewer) && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
          )}
        </div>
      </div>

      {/* Changes requested banner for employees */}
      {isEmployee && post.status === "changes_requested" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Changes have been requested. Edit your post and resubmit for review.</p>
          {post.notes && <p className="text-sm text-red-600 dark:text-red-300 mt-1">Note: {post.notes}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Post Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  className="font-mono text-sm"
                  disabled={!canEdit}
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

              {canEdit && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
              <TabsTrigger value="revisions">Revisions ({revisions.length})</TabsTrigger>
            </TabsList>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Add comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment or feedback..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button onClick={handleAddComment} disabled={submittingComment || !newComment.trim()} className="self-end">
                      {submittingComment ? "..." : "Send"}
                    </Button>
                  </div>

                  <Separator />

                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                            {c.author_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{c.author_name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm mt-1">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revisions Tab */}
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
          {/* Workflow Card */}
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
                        variant={status === "changes_requested" ? "destructive" : status === "published" ? "default" : "outline"}
                        size="sm"
                        onClick={() => noteStatuses.includes(status) ? handleTransitionWithNote(status) : handleTransition(status)}
                        className="justify-start"
                      >
                        {POST_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {nextStatuses.length === 0 && post.status !== "published" && (
                <p className="text-xs text-muted-foreground">No actions available for your role at this stage.</p>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Author</Label>
                <p className="text-sm font-medium">{post.author_name}</p>
              </div>

              <Separator />

              {canEdit && (
                <>
                  <div className="space-y-2">
                    <Label>Scheduled Date</Label>
                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </div>

                  {canAssignDesigner && (
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
                  )}

                  {(isReviewer) && (
                    <div className="space-y-2">
                      <Label>Internal Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Internal notes, feedback..."
                      />
                    </div>
                  )}

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}

              {post.ai_prompt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">AI Prompt Used</Label>
                    <p className="text-sm mt-1">{post.ai_prompt}</p>
                  </div>
                </>
              )}

              {isDesigner && post.assigned_designer_id === currentUser?.id && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground font-medium">You are the assigned designer for this post.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
