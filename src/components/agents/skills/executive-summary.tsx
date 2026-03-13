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

export default function ExecutiveSummarySkill() {
  const { currentUser } = useUser();

  const [sourceContent, setSourceContent] = useState("");
  const [format, setFormat] = useState("one-pager");
  const [audience, setAudience] = useState("c-suite");
  const [focusAreas, setFocusAreas] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!sourceContent.trim()) {
      toast.error("Source content is required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "executive-summary",
          inputs: { sourceContent, format, audience, focusAreas },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("Executive summary generated");
    } catch {
      toast.error("Failed to generate executive summary");
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
          skill_id: "executive-summary",
          title,
          input_params: { sourceContent, format, audience, focusAreas },
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
        skillName="Executive Summary"
        skillDescription="Distill complex content into executive-ready summaries with key metrics, decision points, and next steps."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Source Content" required>
          <textarea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder="Paste the content you want summarized..."
            rows={6}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Format">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className={inputClasses}
          >
            <option value="one-pager">One-Pager</option>
            <option value="executive-brief">Executive Brief</option>
            <option value="slide-summary">Slide Summary</option>
            <option value="email-brief">Email Brief</option>
          </select>
        </FormField>

        <FormField label="Audience">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={inputClasses}
          >
            <option value="c-suite">C-Suite</option>
            <option value="board">Board</option>
            <option value="team-leads">Team Leads</option>
            <option value="investors">Investors</option>
          </select>
        </FormField>

        <FormField label="Focus Areas">
          <textarea
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            placeholder="Specific areas to emphasize in the summary..."
            rows={3}
            className={inputClasses}
          />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Bottom Line */}
          {o?.bottomLine && (
            <OutputCard className="border-primary/30 bg-primary/5">
              <p className="text-xs font-semibold text-primary mb-1">Bottom Line</p>
              <p className="text-sm font-medium">{String(o.bottomLine)}</p>
            </OutputCard>
          )}

          {/* Word Count Badge */}
          {o?.wordCount && (
            <div className="flex gap-2">
              <OutputBadge label={`${o.wordCount} words`} color="blue" />
            </div>
          )}

          {/* Key Sections */}
          {Array.isArray(o?.keySections) && (
            <div className="space-y-4">
              {(o.keySections as Array<{ title: string; content: string }>).map(
                (section, i) => (
                  <OutputSection key={i} title={section.title}>
                    <p className="text-sm">{section.content}</p>
                  </OutputSection>
                )
              )}
            </div>
          )}

          {/* Key Metrics */}
          {Array.isArray(o?.keyMetrics) && (
            <OutputSection title="Key Metrics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(o.keyMetrics as Array<{ label: string; value: string }>).map(
                  (metric, i) => (
                    <div
                      key={i}
                      className="bg-card border rounded-lg p-3 text-center"
                    >
                      <p className="text-lg font-bold">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                    </div>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Decision Points */}
          {Array.isArray(o?.decisionPoints) && (
            <OutputSection title="Decision Points">
              <div className="grid gap-3">
                {(
                  o.decisionPoints as Array<{
                    decision: string;
                    options: string[];
                    recommendation: string;
                  }>
                ).map((item, i) => (
                  <OutputCard key={i} title={item.decision}>
                    {Array.isArray(item.options) && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Options
                        </p>
                        <OutputList items={item.options} />
                      </div>
                    )}
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2 mt-2">
                      <p className="text-xs font-semibold text-primary mb-0.5">
                        Recommendation
                      </p>
                      <p className="text-sm">{item.recommendation}</p>
                    </div>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Next Steps */}
          {Array.isArray(o?.nextSteps) && (
            <OutputSection title="Next Steps">
              <ol className="space-y-1 list-decimal list-inside">
                {(o.nextSteps as string[]).map((step, i) => (
                  <li key={i} className="text-sm">
                    {step}
                  </li>
                ))}
              </ol>
            </OutputSection>
          )}

          {/* Full Summary */}
          {o?.fullSummary && (
            <OutputSection title="Full Summary">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-card">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {String(o.fullSummary)}
                </pre>
              </div>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
