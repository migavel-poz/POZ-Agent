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

export default function CouncilReviewSkill() {
  const { currentUser } = useUser();

  const [contentToReview, setContentToReview] = useState("");
  const [contentType, setContentType] = useState("linkedin-post");
  const [reviewFocus, setReviewFocus] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!contentToReview.trim()) {
      toast.error("Content to review is required");
      return;
    }
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "council-review",
          inputs: { contentToReview, contentType, reviewFocus, targetAudience },
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setOutput(data);
      toast.success("Council review generated");
    } catch {
      toast.error("Failed to generate council review");
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
          skill_id: "council-review",
          title,
          input_params: { contentToReview, contentType, reviewFocus, targetAudience },
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

  const renderReviewerCard = (
    reviewerKey: string,
    reviewerLabel: string
  ) => {
    const reviewer = o?.[reviewerKey] as
      | {
          score: number;
          strengths: string[];
          concerns: string[];
          suggestions: string[];
        }
      | undefined;
    if (!reviewer) return null;
    return (
      <OutputCard title={reviewerLabel}>
        <div className="text-center mb-3">
          <span className="text-2xl font-bold">{reviewer.score}</span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
        {Array.isArray(reviewer.strengths) && reviewer.strengths.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
              Strengths
            </p>
            <OutputList items={reviewer.strengths} color="text-green-600 dark:text-green-400" />
          </div>
        )}
        {Array.isArray(reviewer.concerns) && reviewer.concerns.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              Concerns
            </p>
            <OutputList items={reviewer.concerns} color="text-red-600 dark:text-red-400" />
          </div>
        )}
        {Array.isArray(reviewer.suggestions) && reviewer.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Suggestions
            </p>
            <OutputList items={reviewer.suggestions} color="text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </OutputCard>
    );
  };

  const priorityColor = (p: string): "red" | "yellow" | "gray" => {
    if (p === "critical") return "red";
    if (p === "important") return "yellow";
    return "gray";
  };

  return (
    <div>
      <SkillForm
        skillName="Council Review"
        skillDescription="Get multi-perspective feedback from a virtual council of a strategist, editor, and critic on your content."
        onGenerate={handleGenerate}
        generating={generating}
        hasOutput={!!output}
      >
        <FormField label="Content to Review" required>
          <textarea
            value={contentToReview}
            onChange={(e) => setContentToReview(e.target.value)}
            placeholder="Paste the content you want reviewed..."
            rows={6}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Content Type">
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className={inputClasses}
          >
            <option value="linkedin-post">LinkedIn Post</option>
            <option value="whitepaper">Whitepaper</option>
            <option value="essay">Essay</option>
            <option value="presentation">Presentation</option>
            <option value="report">Report</option>
          </select>
        </FormField>

        <FormField label="Review Focus">
          <textarea
            value={reviewFocus}
            onChange={(e) => setReviewFocus(e.target.value)}
            placeholder="clarity, persuasiveness, evidence-quality, tone, structure, originality"
            rows={2}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Target Audience">
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Marketing professionals, C-suite"
            className={inputClasses}
          />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={handleSave} saving={saving} saved={saved}>
          {/* Overall Score */}
          {o?.overallScore !== undefined && (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <span className="text-5xl font-bold">{String(o.overallScore)}</span>
                <span className="text-xl text-muted-foreground">/10</span>
                <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
              </div>
            </div>
          )}

          {/* Three Reviewer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderReviewerCard("strategistReview", "Strategist Review")}
            {renderReviewerCard("editorReview", "Editor Review")}
            {renderReviewerCard("criticReview", "Critic Review")}
          </div>

          {/* Consensus Strengths + Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(o?.consensusStrengths) && (
              <OutputSection title="Consensus Strengths">
                <OutputList
                  items={o.consensusStrengths as string[]}
                  color="text-green-600 dark:text-green-400"
                />
              </OutputSection>
            )}
            {Array.isArray(o?.consensusConcerns) && (
              <OutputSection title="Consensus Concerns">
                <OutputList
                  items={o.consensusConcerns as string[]}
                  color="text-red-600 dark:text-red-400"
                />
              </OutputSection>
            )}
          </div>

          {/* Prioritized Revisions */}
          {Array.isArray(o?.prioritizedRevisions) && (
            <OutputSection title="Prioritized Revisions">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Priority</th>
                      <th className="text-left py-2 pr-4 font-medium">Revision</th>
                      <th className="text-left py-2 font-medium">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      o.prioritizedRevisions as Array<{
                        priority: string;
                        revision: string;
                        rationale?: string;
                      }>
                    ).map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <OutputBadge
                            label={item.priority}
                            color={priorityColor(item.priority)}
                          />
                        </td>
                        <td className="py-2 pr-4">{item.revision}</td>
                        <td className="py-2 text-muted-foreground">
                          {item.rationale || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OutputSection>
          )}

          {/* Revised Excerpts */}
          {Array.isArray(o?.revisedExcerpts) && (
            <OutputSection title="Revised Excerpts">
              <div className="space-y-3">
                {(
                  o.revisedExcerpts as Array<{ original: string; revised: string }>
                ).map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                        Original
                      </p>
                      <p className="text-sm">{item.original}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Revised
                      </p>
                      <p className="text-sm">{item.revised}</p>
                    </div>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
