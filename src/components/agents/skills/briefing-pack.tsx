"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function BriefingPackSkill() {
  const { currentUser } = useUser();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("one-pager");
  const [audience, setAudience] = useState("executive");
  const [keyData, setKeyData] = useState("");
  const [objective, setObjective] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!topic) { toast.error("Please enter a topic"); return; }
    if (!keyData) { toast.error("Please enter key data"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "briefing-pack", inputs: { topic, format, audience, keyData, objective } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Briefing pack generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "briefing-pack", title, input_params: JSON.stringify({ topic, format, audience, keyData, objective }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const keyFindings = (output?.keyFindings as Array<Record<string, any>>) || [];
  const dataHighlights = (output?.dataHighlights as Array<Record<string, any>>) || [];
  const options = (output?.options as Array<Record<string, any>>) || [];
  const nextSteps = (output?.nextSteps as Array<Record<string, any>>) || [];

  const trendIndicator = (trend: string) => {
    if (trend === "up") return <span className="text-green-600 dark:text-green-400">&uarr;</span>;
    if (trend === "down") return <span className="text-red-600 dark:text-red-400">&darr;</span>;
    return <span className="text-gray-400">&mdash;</span>;
  };

  return (
    <div>
      <SkillForm skillName="Briefing Pack Generator" skillDescription="Generate executive briefings, one-pagers, slide deck outlines, and memos with data-driven insights." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Topic" required>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Q1 Market Expansion Analysis" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="one-pager">One-Pager</option>
              <option value="slide-deck-outline">Slide Deck Outline</option>
              <option value="memo">Memo</option>
              <option value="brief">Brief</option>
            </select>
          </FormField>
          <FormField label="Audience">
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="executive">Executive</option>
              <option value="board">Board</option>
              <option value="investor">Investor</option>
              <option value="team">Team</option>
              <option value="client">Client</option>
            </select>
          </FormField>
        </div>
        <FormField label="Key Data" required>
          <textarea value={keyData} onChange={(e) => setKeyData(e.target.value)} placeholder="Paste key data points, metrics, research findings..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]" />
        </FormField>
        <FormField label="Objective">
          <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What should this briefing achieve?" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Title + Subtitle header */}
          {(output.title || output.subtitle) && (
            <div className="border-b pb-3">
              {output.title && <h3 className="text-lg font-bold">{output.title as string}</h3>}
              {output.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{output.subtitle as string}</p>}
            </div>
          )}

          {/* Executive Summary */}
          {output.executiveSummary && (
            <OutputCard title="Executive Summary">
              <p className="text-sm">{output.executiveSummary as string}</p>
            </OutputCard>
          )}

          {/* Situation Overview */}
          {output.situationOverview && (
            <OutputSection title="Situation Overview">
              <p className="text-sm">{output.situationOverview as string}</p>
            </OutputSection>
          )}

          {/* Key Findings */}
          {keyFindings.length > 0 && (
            <OutputSection title="Key Findings">
              <div className="grid gap-3">
                {keyFindings.map((finding, i) => (
                  <OutputCard key={i}>
                    <p className="text-sm font-medium">{finding.finding as string}</p>
                    {finding.evidence && <p className="text-sm text-muted-foreground mt-1">{finding.evidence as string}</p>}
                    {finding.significance && <p className="text-xs text-primary mt-1 font-medium">{finding.significance as string}</p>}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Data Highlights stat grid */}
          {dataHighlights.length > 0 && (
            <OutputSection title="Data Highlights">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dataHighlights.map((stat, i) => (
                  <div key={i} className="bg-card border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xl font-bold">{stat.value as string}</span>
                      {stat.trend && trendIndicator(stat.trend as string)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label as string}</p>
                    {stat.change && <p className="text-xs text-muted-foreground">{stat.change as string}</p>}
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Options with pros/cons */}
          {options.length > 0 && (
            <OutputSection title="Options">
              <div className="grid gap-3">
                {options.map((option, i) => (
                  <OutputCard key={i} className={option.recommended ? "border-primary border-2" : ""}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{option.title as string}</p>
                      {option.recommended && <OutputBadge label="Recommended" color="green" />}
                    </div>
                    {option.description && <p className="text-sm text-muted-foreground mb-2">{option.description as string}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      {(option.pros as string[])?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Pros</p>
                          <OutputList items={option.pros as string[]} color="text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(option.cons as string[])?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Cons</p>
                          <OutputList items={option.cons as string[]} color="text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Recommendation */}
          {output.recommendation && (
            <OutputCard title="Recommendation">
              <p className="text-sm">{output.recommendation as string}</p>
            </OutputCard>
          )}

          {/* Next Steps table */}
          {nextSteps.length > 0 && (
            <OutputSection title="Next Steps">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Action</th>
                      <th className="text-left py-2 pr-4">Owner</th>
                      <th className="text-left py-2">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextSteps.map((step, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{step.action as string}</td>
                        <td className="py-2 pr-4 font-medium">{step.owner as string}</td>
                        <td className="py-2">{step.timeline as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OutputSection>
          )}

          {/* Full Briefing scrollable */}
          {output.fullBriefing && (
            <OutputSection title="Full Briefing">
              <div className="max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap">
                {output.fullBriefing as string}
              </div>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
