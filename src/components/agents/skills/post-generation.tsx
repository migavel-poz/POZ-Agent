"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function PostGenerationSkill() {
  const { currentUser } = useUser();
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("short-post");
  const [platform, setPlatform] = useState("linkedin");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!topic) { toast.error("Please enter a topic"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "post-generation", inputs: { topic, postType, platform, tone, targetAudience, additionalContext } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Post generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "post-generation", title, input_params: JSON.stringify({ topic, postType, platform, tone, targetAudience, additionalContext }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const slides = (output?.slides as Array<Record<string, unknown>>) || [];
  const threadPosts = (output?.threadPosts as string[]) || [];
  const hashtags = (output?.hashtags as string[]) || [];

  return (
    <div>
      <SkillForm skillName="Post Generation" skillDescription="Generate LinkedIn carousels, short posts, long-form articles, and threads." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Topic" required>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What is this post about?" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Post Type">
            <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="short-post">Short Post</option><option value="long-form">Long-Form</option><option value="carousel">Carousel</option><option value="thread">Thread</option>
            </select>
          </FormField>
          <FormField label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="linkedin">LinkedIn</option><option value="twitter">Twitter/X</option><option value="blog">Blog</option>
            </select>
          </FormField>
          <FormField label="Tone">
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="professional">Professional</option><option value="conversational">Conversational</option><option value="provocative">Provocative</option><option value="storytelling">Storytelling</option>
            </select>
          </FormField>
        </div>
        <FormField label="Target Audience">
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., CTOs, product managers, startup founders" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Additional Context">
          <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Data points, personal angle, specific examples..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          <div className="flex items-center gap-3">
            <OutputBadge label={`${output.wordCount || 0} words`} color="blue" />
            <OutputBadge label={output.readingTime as string || ""} color="gray" />
          </div>
          {output.fullPost && (
            <OutputSection title="Full Post">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{output.fullPost as string}</div>
            </OutputSection>
          )}
          {slides.length > 0 && (
            <OutputSection title="Carousel Slides">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slides.map((s, i) => (
                  <OutputCard key={i} title={`Slide ${s.slideNumber}`}>
                    <p className="font-medium text-sm">{s.headline as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.bodyText as string}</p>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}
          {threadPosts.length > 0 && (
            <OutputSection title="Thread Posts">
              <div className="space-y-2">
                {threadPosts.map((p, i) => (
                  <OutputCard key={i} title={`Post ${i + 1}`}><p className="text-sm">{p}</p></OutputCard>
                ))}
              </div>
            </OutputSection>
          )}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((h, i) => <OutputBadge key={i} label={h} color="blue" />)}
            </div>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
