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

export default function ArgumentStructuringSkill() {
  const { currentUser } = useUser();

  const [thesis, setThesis] = useState("");
  const [framework, setFramework] = useState("mece");
  const [keyPoints, setKeyPoints] = useState("");
  const [counterarguments, setCounterarguments] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!thesis.trim()) {
      toast.error("Thesis is required");
      return;
    }
    if (!keyPoints.trim()) {
      toast.error("Key points are required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "argument-structuring",
          inputs: { thesis, framework, keyPoints, counterarguments, evidenceNotes },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("Argument structure generated");
    } catch {
      toast.error("Failed to generate argument structure");
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
          skill_id: "argument-structuring",
          title,
          input_params: { thesis, framework, keyPoints, counterarguments, evidenceNotes },
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
        skillName="Argument Structuring"
        skillDescription="Build a well-structured argument with thesis, supporting points, counterarguments, and logical flow."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Thesis" required>
          <input
            type="text"
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="e.g., Companies should adopt async-first communication"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Framework">
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className={inputClasses}
          >
            <option value="mece">MECE</option>
            <option value="pyramid">Pyramid</option>
            <option value="problem-solution">Problem-Solution</option>
            <option value="compare-contrast">Compare &amp; Contrast</option>
          </select>
        </FormField>

        <FormField label="Key Points" required>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="List your main supporting points..."
            rows={4}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Counterarguments">
          <textarea
            value={counterarguments}
            onChange={(e) => setCounterarguments(e.target.value)}
            placeholder="Known counterarguments to address..."
            rows={3}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Evidence Notes">
          <textarea
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="Supporting evidence, data, or references..."
            rows={3}
            className={inputClasses}
          />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Thesis + One Line Summary + Elevator Pitch */}
          <div className="grid gap-3">
            {o?.thesis && (
              <OutputCard title="Thesis" className="border-primary/30 bg-primary/5">
                <p className="text-sm font-medium">{String(o.thesis)}</p>
              </OutputCard>
            )}
            {o?.oneLineSummary && (
              <OutputCard title="One-Line Summary">
                <p className="text-sm">{String(o.oneLineSummary)}</p>
              </OutputCard>
            )}
            {o?.elevatorPitch && (
              <OutputCard title="Elevator Pitch">
                <p className="text-sm">{String(o.elevatorPitch)}</p>
              </OutputCard>
            )}
          </div>

          {/* Argument Structure */}
          {Array.isArray(o?.argumentStructure) && (
            <OutputSection title="Argument Structure">
              <div className="space-y-1">
                {(
                  o.argumentStructure as Array<{
                    point: string;
                    level: number;
                    subPoints?: string[];
                  }>
                ).map((item, i) => (
                  <div
                    key={i}
                    style={{ paddingLeft: `${(item.level || 0) * 16}px` }}
                  >
                    <p className="text-sm">
                      <span className="font-medium">{item.point}</span>
                    </p>
                    {Array.isArray(item.subPoints) &&
                      item.subPoints.map((sub, j) => (
                        <p
                          key={j}
                          className="text-xs text-muted-foreground ml-4 mt-0.5"
                        >
                          - {sub}
                        </p>
                      ))}
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Counterarguments */}
          {Array.isArray(o?.counterarguments) && (
            <OutputSection title="Counterarguments &amp; Rebuttals">
              <div className="space-y-3">
                {(
                  o.counterarguments as Array<{ objection: string; rebuttal: string }>
                ).map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                        Objection
                      </p>
                      <p className="text-sm">{item.objection}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Rebuttal
                      </p>
                      <p className="text-sm">{item.rebuttal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Strength Assessment */}
          {o?.strengthAssessment && (
            <OutputSection title="Strength Assessment">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["strengths", "weaknesses", "improvements"] as const).map((key) => {
                  const assessment = o.strengthAssessment as Record<string, string[]>;
                  const colors = {
                    strengths: "text-green-600 dark:text-green-400",
                    weaknesses: "text-red-600 dark:text-red-400",
                    improvements: "text-blue-600 dark:text-blue-400",
                  };
                  return (
                    <div key={key}>
                      <h6 className="text-xs font-semibold uppercase mb-2 capitalize">
                        {key}
                      </h6>
                      <OutputList
                        items={assessment?.[key] || []}
                        color={colors[key]}
                      />
                    </div>
                  );
                })}
              </div>
            </OutputSection>
          )}

          {/* Logic Flow */}
          {o?.logicFlow && (
            <OutputSection title="Logic Flow">
              <p className="text-sm leading-relaxed">{String(o.logicFlow)}</p>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
