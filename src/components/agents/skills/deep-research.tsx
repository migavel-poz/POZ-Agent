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

export default function DeepResearchSkill() {
  const { currentUser } = useUser();

  const [researchQuestion, setResearchQuestion] = useState("");
  const [scope, setScope] = useState("broad-landscape");
  const [sources, setSources] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [outputFocus, setOutputFocus] = useState("evidence-based");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!researchQuestion.trim()) {
      toast.error("Research question is required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "deep-research",
          inputs: { researchQuestion, scope, sources, depth, outputFocus },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("Research generated");
    } catch {
      toast.error("Failed to generate research");
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
          skill_id: "deep-research",
          title,
          input_params: { researchQuestion, scope, sources, depth, outputFocus },
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

  const confidenceColor = (c: string): "green" | "yellow" | "red" => {
    if (c === "high") return "green";
    if (c === "medium") return "yellow";
    return "red";
  };

  return (
    <div>
      <SkillForm
        skillName="Deep Research"
        skillDescription="Conduct thorough research on a topic with key findings, thematic analysis, and content angles."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Research Question" required>
          <input
            type="text"
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="e.g., How is AI changing content marketing?"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Scope">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className={inputClasses}
          >
            <option value="narrow-focused">Narrow &amp; Focused</option>
            <option value="broad-landscape">Broad Landscape</option>
            <option value="competitive">Competitive</option>
          </select>
        </FormField>

        <FormField label="Sources">
          <textarea
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder="Specify preferred sources, reports, or publications..."
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Depth">
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className={inputClasses}
          >
            <option value="summary">Summary</option>
            <option value="detailed">Detailed</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </FormField>

        <FormField label="Output Focus">
          <select
            value={outputFocus}
            onChange={(e) => setOutputFocus(e.target.value)}
            className={inputClasses}
          >
            <option value="evidence-based">Evidence-Based</option>
            <option value="trend-analysis">Trend Analysis</option>
            <option value="opinion-landscape">Opinion Landscape</option>
          </select>
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Executive Summary */}
          {o?.executiveSummary && (
            <OutputCard title="Executive Summary" className="border-primary/30 bg-primary/5">
              <p className="text-sm">{String(o.executiveSummary)}</p>
            </OutputCard>
          )}

          {/* Key Findings */}
          {Array.isArray(o?.keyFindings) && (
            <OutputSection title="Key Findings">
              <div className="grid gap-3">
                {(o.keyFindings as Array<{ finding: string; confidence: string; detail?: string }>).map(
                  (item, i) => (
                    <OutputCard key={i}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{item.finding}</p>
                        <OutputBadge
                          label={item.confidence}
                          color={confidenceColor(item.confidence)}
                        />
                      </div>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground mt-2">{item.detail}</p>
                      )}
                    </OutputCard>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Thematic Analysis */}
          {Array.isArray(o?.thematicAnalysis) && (
            <OutputSection title="Thematic Analysis">
              <div className="space-y-3">
                {(o.thematicAnalysis as Array<{ theme: string; analysis: string }>).map(
                  (item, i) => (
                    <div key={i}>
                      <h6 className="text-sm font-semibold">{item.theme}</h6>
                      <p className="text-sm text-muted-foreground mt-1">{item.analysis}</p>
                    </div>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Data Points */}
          {Array.isArray(o?.dataPoints) && (
            <OutputSection title="Data Points">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(o.dataPoints as Array<{ label: string; value: string; source?: string }>).map(
                  (item, i) => (
                    <div
                      key={i}
                      className="bg-card border rounded-lg p-3 text-center"
                    >
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      {item.source && (
                        <p className="text-xs text-muted-foreground/60 mt-1">{item.source}</p>
                      )}
                    </div>
                  )
                )}
              </div>
            </OutputSection>
          )}

          {/* Gaps and Limitations */}
          {Array.isArray(o?.gapsAndLimitations) && (
            <OutputSection title="Gaps &amp; Limitations">
              <OutputList
                items={(o.gapsAndLimitations as unknown[]).map((g) =>
                  typeof g === "string" ? g : JSON.stringify(g)
                )}
                color="text-yellow-600 dark:text-yellow-400"
              />
            </OutputSection>
          )}

          {/* Bibliography */}
          {Array.isArray(o?.bibliography) && (
            <details className="bg-muted/30 rounded-lg p-4">
              <summary className="text-sm font-semibold cursor-pointer">
                Bibliography ({(o.bibliography as unknown[]).length} sources)
              </summary>
              <ul className="mt-2 space-y-1">
                {(o.bibliography as unknown[]).map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {typeof item === "string"
                      ? item
                      : `${(item as Record<string, string>).title || ""}${(item as Record<string, string>).author ? ` — ${(item as Record<string, string>).author}` : ""}${(item as Record<string, string>).year ? ` (${(item as Record<string, string>).year})` : ""}${(item as Record<string, string>).relevance ? ` · ${(item as Record<string, string>).relevance}` : ""}`}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Content Angles */}
          {Array.isArray(o?.contentAngles) && (
            <OutputSection title="Content Angles">
              <OutputList
                items={(o.contentAngles as unknown[]).map((a) =>
                  typeof a === "string" ? a : JSON.stringify(a)
                )}
                color="text-blue-600 dark:text-blue-400"
              />
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
