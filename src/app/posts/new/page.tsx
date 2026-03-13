"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { POST_TYPE_LABELS, POST_TYPE_DESCRIPTIONS, ALL_POST_TYPES } from "@/lib/constants";
import { PostType } from "@/lib/types";
import { toast } from "sonner";

export default function NewPostPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [step, setStep] = useState<"type" | "prompt" | "preview">("type");
  const [postType, setPostType] = useState<PostType | null>(null);
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, unknown> | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || !postType) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, post_type: postType, additional_context: additionalContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGeneratedContent(data);
      if (postType === "carousel") {
        setEditedTitle(data.title || topic);
        setEditedContent(data.captionText || "");
      } else {
        setEditedTitle(data.title || topic);
        setEditedContent(data.fullPost || `${data.hook}\n\n${data.body}\n\n${data.callToAction}`);
      }
      setStep("preview");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !postType) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: editedTitle,
        content: editedContent,
        post_type: postType,
        author_id: currentUser.id,
        ai_prompt: topic,
        ai_model: "gpt-4o",
      };

      if (generatedContent) {
        const hashtags = (generatedContent as Record<string, unknown>).hashtags;
        if (Array.isArray(hashtags)) {
          body.hashtags = JSON.stringify(hashtags);
        }
        if (postType === "carousel" && (generatedContent as Record<string, unknown>).slides) {
          body.carousel_slides = JSON.stringify({
            slides: (generatedContent as Record<string, unknown>).slides,
            closingSlide: (generatedContent as Record<string, unknown>).closingSlide,
          });
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const post = await res.json();
      if (!res.ok) throw new Error(post.error || "Failed to save");

      toast.success("Post saved as draft!");
      router.push(`/posts/${post.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Post</h2>
        <p className="text-muted-foreground">Generate an AI-powered LinkedIn post</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Select Type", "Enter Topic", "Preview & Edit"].map((label, i) => {
          const stepNames = ["type", "prompt", "preview"];
          const isActive = stepNames[i] === step;
          const isPast = stepNames.indexOf(step) > i;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <div className={`flex items-center gap-1.5 ${isActive ? "text-primary font-medium" : isPast ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {isPast ? "\u2713" : i + 1}
                </div>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Type */}
      {step === "type" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_POST_TYPES.map((type) => (
            <Card
              key={type}
              className={`cursor-pointer transition-all hover:border-primary ${postType === type ? "border-primary ring-2 ring-primary/20" : ""}`}
              onClick={() => { setPostType(type); setStep("prompt"); }}
            >
              <CardHeader>
                <CardTitle className="text-lg">{POST_TYPE_LABELS[type]}</CardTitle>
                <CardDescription>{POST_TYPE_DESCRIPTIONS[type]}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Enter Topic */}
      {step === "prompt" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to post about?</CardTitle>
            <CardDescription>Post type: {postType ? POST_TYPE_LABELS[postType] : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Main Idea</Label>
              <Input
                id="topic"
                placeholder="e.g., How AI is transforming software development workflows..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Additional Context (optional)</Label>
              <Textarea
                id="context"
                placeholder="Any specific points, data, personal experience, or angle you want to include..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("type")}>Back</Button>
              <Button onClick={handleGenerate} disabled={!topic.trim() || generating}>
                {generating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Edit */}
      {step === "preview" && generatedContent && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit & Refine</CardTitle>
              <CardDescription>Review the AI-generated content and make any edits before saving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Internal Title</Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {postType === "carousel" && generatedContent && Array.isArray((generatedContent as Record<string, unknown[]>).slides) && (
                <div className="space-y-2">
                  <Label>Carousel Slides Preview</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {((generatedContent as Record<string, unknown[]>).slides as Array<{ slideNumber: number; headline: string; bodyText: string }>).map((slide, i: number) => (
                      <Card key={i} className="p-3">
                        <p className="text-xs text-muted-foreground">Slide {slide.slideNumber || i + 1}</p>
                        <p className="font-semibold text-sm">{slide.headline}</p>
                        <p className="text-xs text-muted-foreground mt-1">{slide.bodyText}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray((generatedContent as Record<string, unknown>).hashtags) && (
                <div className="flex gap-2 flex-wrap">
                  {((generatedContent as Record<string, unknown>).hashtags as string[]).map((tag: string) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("prompt")}>Back to Edit Prompt</Button>
            <Button variant="outline" onClick={handleGenerate} disabled={generating}>
              {generating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button onClick={handleSave} disabled={saving || !editedContent.trim()}>
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
