"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function SeoOptimizationSkill() {
  const { currentUser } = useUser();
  const [pageUrl, setPageUrl] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!primaryKeyword) { toast.error("Please enter a primary keyword"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "seo-optimization", inputs: { pageUrl, primaryKeyword, secondaryKeywords, pageContent, competitorUrls } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("SEO brief generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "seo-optimization", title, input_params: JSON.stringify({ pageUrl, primaryKeyword, secondaryKeywords, pageContent, competitorUrls }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const headings = (output?.headingStructure as Array<Record<string, string>>) || [];
  const checklist = (output?.technicalChecklist as Array<Record<string, string>>) || [];
  const contentGaps = (output?.contentGaps as string[]) || [];
  const linkSuggestions = (output?.internalLinkSuggestions as string[]) || [];
  const priorityFixes = (output?.priorityFixes as string[]) || [];

  return (
    <div>
      <SkillForm skillName="SEO / On-Page Optimization" skillDescription="Generate SEO briefs with title tags, meta descriptions, heading structures, and keyword recommendations." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Page URL or Topic">
          <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://example.com/page or topic name" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Primary Keyword" required>
          <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} placeholder="Main target keyword" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Secondary Keywords">
          <textarea value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} placeholder="Comma-separated secondary keywords" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
        <FormField label="Existing Page Content (optional)">
          <textarea value={pageContent} onChange={(e) => setPageContent(e.target.value)} placeholder="Paste existing page content..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Competitor URLs (optional)">
          <textarea value={competitorUrls} onChange={(e) => setCompetitorUrls(e.target.value)} placeholder="Competitor pages to analyze" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <OutputCard title="Title Tag" className="border-blue-200 dark:border-blue-800">
              <p className="text-sm font-mono">{output.titleTag as string}</p>
            </OutputCard>
            <OutputCard title="Meta Description" className="border-blue-200 dark:border-blue-800">
              <p className="text-sm">{output.metaDescription as string}</p>
            </OutputCard>
            <OutputCard title="H1 Suggestion" className="border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold">{output.h1Suggestion as string}</p>
            </OutputCard>
          </div>
          <div className="flex items-center gap-3">
            {output.estimatedWordCount && <OutputBadge label={`${output.estimatedWordCount} words`} color="blue" />}
            {output.readabilityScore && <OutputBadge label={`Readability: ${output.readabilityScore}`} color="green" />}
          </div>
          {headings.length > 0 && (
            <OutputSection title="Heading Structure">
              <div className="space-y-1">
                {headings.map((h, i) => (
                  <div key={i} className={`text-sm ${h.level === "H2" ? "ml-0 font-medium" : "ml-6 text-muted-foreground"}`}>
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{h.level}</span>
                    {h.text}
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
          {priorityFixes.length > 0 && <OutputSection title="Priority Fixes"><OutputList items={priorityFixes} color="text-red-600 dark:text-red-400" /></OutputSection>}
          {checklist.length > 0 && (
            <OutputSection title="Technical Checklist">
              <div className="space-y-2">
                {checklist.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="font-medium shrink-0">{c.item}</span>
                    <span className="text-muted-foreground">{c.recommendation}</span>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
          {contentGaps.length > 0 && <OutputSection title="Content Gaps"><OutputList items={contentGaps} /></OutputSection>}
          {linkSuggestions.length > 0 && <OutputSection title="Internal Link Suggestions"><OutputList items={linkSuggestions} /></OutputSection>}
        </SkillOutput>
      )}
    </div>
  );
}
