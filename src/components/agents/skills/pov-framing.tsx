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

export default function PovFramingSkill() {
  const { currentUser } = useUser();

  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("contrarian");
  const [industryContext, setIndustryContext] = useState("");
  const [existingNarratives, setExistingNarratives] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Topic is required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "pov-framing",
          inputs: { topic, angle, industryContext, existingNarratives, targetAudience },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("POV framework generated");
    } catch {
      toast.error("Failed to generate POV framework");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (title: string) => {
    if (!output) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "thought-leadership",
          skill_id: "pov-framing",
          title,
          input_params: { topic, angle, industryContext, existingNarratives, targetAudience },
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

  const o = output as Record<string, any> | null;

  return (
    <div>
      <SkillForm
        skillName="POV Framing"
        skillDescription="Develop a unique point of view on a topic with contrarian insights, narrative arcs, and evidence-backed arguments."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Topic" required>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The future of remote work"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Angle">
          <select
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            className={inputClasses}
          >
            <option value="contrarian">Contrarian</option>
            <option value="future-forward">Future-Forward</option>
            <option value="problem-reframe">Problem Reframe</option>
            <option value="first-principles">First Principles</option>
          </select>
        </FormField>

        <FormField label="Industry Context">
          <textarea
            value={industryContext}
            onChange={(e) => setIndustryContext(e.target.value)}
            placeholder="Provide relevant industry background..."
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Existing Narratives">
          <textarea
            value={existingNarratives}
            onChange={(e) => setExistingNarratives(e.target.value)}
            placeholder="What are the common narratives around this topic?"
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Target Audience">
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Tech executives, startup founders"
            className={inputClasses}
          />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Thesis highlighted card */}
          {o?.thesis && (
            <OutputCard className="border-primary/30 bg-primary/5">
              <p className="text-sm font-medium">{String(o.thesis)}</p>
            </OutputCard>
          )}

          {/* Headline */}
          {o?.headline && (
            <OutputSection title="Headline">
              <p className="text-lg font-bold">{String(o.headline)}</p>
            </OutputSection>
          )}

          {/* Conventional Wisdom vs Contrarian Insight */}
          {(o?.conventionalWisdom || o?.contrarianInsight) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {o?.conventionalWisdom && (
                <OutputCard title="Conventional Wisdom" className="border-gray-300">
                  <p className="text-sm text-muted-foreground">{String(o.conventionalWisdom)}</p>
                </OutputCard>
              )}
              {o?.contrarianInsight && (
                <OutputCard title="Contrarian Insight" className="border-primary/40 bg-primary/5">
                  <p className="text-sm">{String(o.contrarianInsight)}</p>
                </OutputCard>
              )}
            </div>
          )}

          {/* Problem Reframe */}
          {o?.problemReframe && (
            <OutputSection title="Problem Reframe">
              <p className="text-sm">{String(o.problemReframe)}</p>
            </OutputSection>
          )}

          {/* Narrative Arc */}
          {o?.narrativeArc && (
            <OutputSection title="Narrative Arc">
              <div className="flex items-center gap-2 flex-wrap">
                {["setup", "tension", "resolution"].map((step, i) => {
                  const arc = o.narrativeArc as Record<string, string>;
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div className="bg-card border rounded-lg p-3 flex-1 min-w-[150px]">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                          {step}
                        </p>
                        <p className="text-sm">{arc?.[step] || ""}</p>
                      </div>
                      {i < 2 && <span className="text-muted-foreground">→</span>}
                    </div>
                  );
                })}
              </div>
            </OutputSection>
          )}

          {/* Evidence Points */}
          {Array.isArray(o?.evidencePoints) && o.evidencePoints.length > 0 && (
            <OutputSection title="Evidence Points">
              <OutputList
                items={o.evidencePoints.map((ep: unknown) =>
                  typeof ep === "string"
                    ? ep
                    : `${(ep as Record<string, string>).point || ""}${(ep as Record<string, string>).source ? ` (${(ep as Record<string, string>).source})` : ""}`
                )}
              />
            </OutputSection>
          )}

          {/* Potential Objections with Rebuttals */}
          {Array.isArray(o?.potentialObjections) && (
            <OutputSection title="Potential Objections">
              <div className="space-y-2">
                {(o.potentialObjections as Array<{ objection: string; rebuttal: string }>).map(
                  (item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                        {item.objection}
                      </summary>
                      <p className="text-sm mt-1 ml-4 text-muted-foreground">{item.rebuttal}</p>
                    </details>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Usage Recommendations */}
          {Array.isArray(o?.usageRecommendations) && (
            <OutputSection title="Usage Recommendations">
              <OutputList items={o.usageRecommendations as string[]} />
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
