"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function AeoOptimizationSkill() {
  const { currentUser } = useUser();
  const [topic, setTopic] = useState("");
  const [targetQueries, setTargetQueries] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [competitors, setCompetitors] = useState("");
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
        body: JSON.stringify({ skillId: "aeo-optimization", inputs: { topic, targetQueries, existingContent, competitors } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("AEO analysis generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "aeo-optimization", title, input_params: JSON.stringify({ topic, targetQueries, existingContent, competitors }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const queries = (output?.targetQueries as Array<Record<string, string>>) || [];
  const faqPairs = (output?.faqPairs as Array<Record<string, string>>) || [];
  const citations = (output?.citationTemplates as string[]) || [];
  const actions = (output?.priorityActions as string[]) || [];
  const guidelines = (output?.contentStructureGuidelines as string[]) || [];
  const schemas = (output?.schemaMarkupSuggestions as string[]) || [];

  return (
    <div>
      <SkillForm skillName="AEO Optimization" skillDescription="Optimize content to appear in AI-generated answers from Gemini, Perplexity, Claude, and ChatGPT." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Topic / Product" required>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., AI consulting services, automation platform" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Target AI Queries">
          <textarea value={targetQueries} onChange={(e) => setTargetQueries(e.target.value)} placeholder="What questions might users ask AI assistants about this?" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Existing Content (optional)">
          <textarea value={existingContent} onChange={(e) => setExistingContent(e.target.value)} placeholder="Paste existing content to optimize..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Competitors">
          <input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Competitor names for context" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {output.currentVisibilityAssessment && (
            <OutputSection title="Current Visibility Assessment">
              <p className="text-sm">{output.currentVisibilityAssessment as string}</p>
            </OutputSection>
          )}
          {actions.length > 0 && (
            <OutputSection title="Priority Actions">
              <ol className="list-decimal list-inside space-y-1">
                {actions.map((a, i) => <li key={i} className="text-sm">{a}</li>)}
              </ol>
            </OutputSection>
          )}
          {queries.length > 0 && (
            <OutputSection title="Target Query Analysis">
              <div className="space-y-3">
                {queries.map((q, i) => (
                  <OutputCard key={i}>
                    <p className="font-medium text-sm">{q.query}</p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">Ideal answer: {q.idealAnswer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.contentRecommendation}</p>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}
          {faqPairs.length > 0 && (
            <OutputSection title="FAQ Pairs (Optimized for AI Extraction)">
              <div className="space-y-2">
                {faqPairs.map((f, i) => (
                  <OutputCard key={i}>
                    <p className="font-medium text-sm">Q: {f.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">A: {f.answer}</p>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}
          {citations.length > 0 && (
            <OutputSection title="Citation Templates">
              <div className="space-y-2">
                {citations.map((c, i) => (
                  <div key={i} className="text-sm bg-background border rounded-md p-3 italic">"{c}"</div>
                ))}
              </div>
            </OutputSection>
          )}
          {guidelines.length > 0 && <OutputSection title="Content Structure Guidelines"><OutputList items={guidelines} /></OutputSection>}
          {schemas.length > 0 && <OutputSection title="Schema Markup Suggestions"><OutputList items={schemas} /></OutputSection>}
        </SkillOutput>
      )}
    </div>
  );
}
