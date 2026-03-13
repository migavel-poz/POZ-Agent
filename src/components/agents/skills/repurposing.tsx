"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function RepurposingSkill() {
  const { currentUser } = useUser();
  const [sourceType, setSourceType] = useState("blog-post");
  const [sourceContent, setSourceContent] = useState("");
  const [targetFormats, setTargetFormats] = useState("linkedin-post, twitter-thread, carousel");
  const [brandVoice, setBrandVoice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!sourceContent) { toast.error("Please paste source content"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "repurposing", inputs: { sourceType, sourceContent, targetFormats, brandVoice } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Content repurposed!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "repurposing", title, input_params: JSON.stringify({ sourceType, sourceContent: sourceContent.substring(0, 200) + "...", targetFormats, brandVoice }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const keyInsights = (output?.keyInsights as string[]) || [];
  const quotableLines = (output?.quotableLines as string[]) || [];
  const outputs = (output?.outputs as Array<Record<string, unknown>>) || [];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <SkillForm skillName="Repurposing Skill" skillDescription="Transform podcasts, meeting notes, blog posts, and whitepapers into multi-format social media content." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Source Type" required>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="podcast-transcript">Podcast Transcript</option><option value="meeting-notes">Meeting Notes</option><option value="blog-post">Blog Post</option><option value="whitepaper">Whitepaper</option><option value="webinar">Webinar</option>
          </select>
        </FormField>
        <FormField label="Source Content" required>
          <textarea value={sourceContent} onChange={(e) => setSourceContent(e.target.value)} placeholder="Paste the source content here..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]" />
        </FormField>
        <FormField label="Target Formats">
          <input value={targetFormats} onChange={(e) => setTargetFormats(e.target.value)} placeholder="linkedin-post, twitter-thread, carousel, email-newsletter, blog-summary, video-script" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Brand Voice (optional)">
          <textarea value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="Brand voice notes..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {output.sourceTitle && (
            <p className="font-semibold text-sm">Source: {output.sourceTitle as string}</p>
          )}
          {keyInsights.length > 0 && <OutputSection title="Key Insights"><OutputList items={keyInsights} color="text-blue-600 dark:text-blue-400" /></OutputSection>}
          {quotableLines.length > 0 && (
            <OutputSection title="Quotable Lines">
              <div className="space-y-2">
                {quotableLines.map((q, i) => (
                  <div key={i} className="text-sm bg-background border rounded-md p-3 italic">"{q}"</div>
                ))}
              </div>
            </OutputSection>
          )}
          {outputs.length > 0 && (
            <div>
              <div className="flex gap-2 mb-3">
                {outputs.map((o, i) => (
                  <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${activeTab === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                    {o.format as string}
                  </button>
                ))}
              </div>
              {outputs[activeTab] && (
                <OutputCard title={outputs[activeTab].title as string}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{outputs[activeTab].content as string}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <OutputBadge label={`${outputs[activeTab].wordCount} words`} color="blue" />
                    {(outputs[activeTab].hashtags as string[])?.map((h, i) => <OutputBadge key={i} label={h} color="gray" />)}
                  </div>
                </OutputCard>
              )}
            </div>
          )}
          {output.repurposingNotes && <OutputSection title="Notes"><p className="text-sm">{output.repurposingNotes as string}</p></OutputSection>}
        </SkillOutput>
      )}
    </div>
  );
}
