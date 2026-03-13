"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import {
  SkillOutput,
  OutputSection,
  OutputList,
  OutputBadge,
  OutputCard,
} from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";

const inputClasses =
  "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function LongFormAssetSkill() {
  const { currentUser } = useUser();

  const [assetType, setAssetType] = useState("whitepaper");
  const [title, setTitle] = useState("");
  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [targetLength, setTargetLength] = useState("3000-words");
  const [targetAudience, setTargetAudience] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!assetType.trim()) {
      toast.error("Asset type is required");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!thesis.trim()) {
      toast.error("Thesis is required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "long-form-asset",
          inputs: { assetType, title, thesis, outline, researchNotes, targetLength, targetAudience },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("Long-form asset generated");
    } catch {
      toast.error("Failed to generate long-form asset");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (saveTitle: string) => {
    if (!output) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "thought-leadership",
          skill_id: "long-form-asset",
          title: saveTitle,
          input_params: { assetType, title, thesis, outline, researchNotes, targetLength, targetAudience },
          output_json: output,
          created_by: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      toast.success("Output saved successfully");
    } catch {
      toast.error("Failed to save output");
    } finally {
      setSaving(false);
    }
  };

  const o = output as Record<string, unknown> | null;

  return (
    <div>
      <SkillForm
        skillName="Long-Form Asset"
        skillDescription="Generate comprehensive long-form content such as whitepapers, essays, reports, guides, or manifestos."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Asset Type" required>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className={inputClasses}
          >
            <option value="whitepaper">Whitepaper</option>
            <option value="essay">Essay</option>
            <option value="report">Report</option>
            <option value="guide">Guide</option>
            <option value="manifesto">Manifesto</option>
          </select>
        </FormField>

        <FormField label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Future of Distributed Teams"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Thesis" required>
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="Your central argument or thesis..."
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Outline">
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            placeholder="Optional outline or section structure..."
            rows={4}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Research Notes">
          <textarea
            value={researchNotes}
            onChange={(e) => setResearchNotes(e.target.value)}
            placeholder="Supporting research, data, or references..."
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Target Length">
          <select
            value={targetLength}
            onChange={(e) => setTargetLength(e.target.value)}
            className={inputClasses}
          >
            <option value="1500-words">1,500 words</option>
            <option value="3000-words">3,000 words</option>
            <option value="5000-words">5,000 words</option>
          </select>
        </FormField>

        <FormField label="Target Audience">
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., CTOs, engineering managers"
            className={inputClasses}
          />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Title + Subtitle Header */}
          {(o?.title || o?.subtitle) && (
            <div className="border-b pb-4">
              {o?.title && <h3 className="text-xl font-bold">{String(o.title)}</h3>}
              {o?.subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{String(o.subtitle)}</p>
              )}
            </div>
          )}

          {/* Word Count + Reading Time Badges */}
          <div className="flex gap-2">
            {o?.wordCount && <OutputBadge label={`${o.wordCount} words`} color="blue" />}
            {o?.readingTime && <OutputBadge label={`${o.readingTime} read`} color="purple" />}
          </div>

          {/* Executive Summary */}
          {o?.executiveSummary && (
            <OutputCard title="Executive Summary" className="border-primary/30 bg-primary/5">
              <p className="text-sm">{String(o.executiveSummary)}</p>
            </OutputCard>
          )}

          {/* Key Statistics */}
          {Array.isArray(o?.keyStatistics) && (
            <OutputSection title="Key Statistics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(o.keyStatistics as Array<{ label: string; value: string }>).map(
                  (stat, i) => (
                    <div
                      key={i}
                      className="bg-card border rounded-lg p-3 text-center"
                    >
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Sections */}
          {Array.isArray(o?.sections) && (
            <div className="space-y-4">
              {(
                o.sections as Array<{
                  heading: string;
                  content: string;
                  keyTakeaway?: string;
                }>
              ).map((section, i) => (
                <OutputSection key={i} title={section.heading}>
                  <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                  {section.keyTakeaway && (
                    <div className="mt-3 bg-primary/5 border border-primary/20 rounded-md p-3">
                      <p className="text-xs font-semibold text-primary mb-1">
                        Key Takeaway
                      </p>
                      <p className="text-sm">{section.keyTakeaway}</p>
                    </div>
                  )}
                </OutputSection>
              ))}
            </div>
          )}

          {/* Conclusion */}
          {o?.conclusion && (
            <OutputCard title="Conclusion">
              <p className="text-sm">{String(o.conclusion)}</p>
            </OutputCard>
          )}

          {/* Suggested Visuals */}
          {Array.isArray(o?.suggestedVisuals) && (
            <OutputSection title="Suggested Visuals">
              <OutputList items={o.suggestedVisuals as string[]} />
            </OutputSection>
          )}

          {/* Full Document */}
          {o?.fullDocument && (
            <OutputSection title="Full Document">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-card">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {String(o.fullDocument)}
                </pre>
              </div>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
