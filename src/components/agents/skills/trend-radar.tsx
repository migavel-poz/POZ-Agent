"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function TrendRadarSkill() {
  const { currentUser } = useUser();
  const [industry, setIndustry] = useState("");
  const [scope, setScope] = useState("both");
  const [timeHorizon, setTimeHorizon] = useState("1-year");
  const [existingKnowledge, setExistingKnowledge] = useState("");
  const [focusLens, setFocusLens] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!industry) { toast.error("Please enter an industry"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "trend-radar", inputs: { industry, scope, timeHorizon, existingKnowledge, focusLens } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Trend radar generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "trend-radar", title, input_params: JSON.stringify({ industry, scope, timeHorizon, existingKnowledge, focusLens }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const trends = (output?.trends as Array<Record<string, unknown>>) || [];
  const convergences = (output?.convergences as Array<Record<string, unknown>>) || [];
  const blindSpots = (output?.blindSpots as string[]) || [];
  const strategicImplications = (output?.strategicImplications as string[]) || [];
  const recommendedWatches = (output?.recommendedWatches as string[]) || [];

  const macroTrends = trends.filter((t) => t.category === "macro");
  const microTrends = trends.filter((t) => t.category === "micro");

  const momentumColor = (m: string): "green" | "blue" | "yellow" | "gray" => {
    if (m === "accelerating") return "green";
    if (m === "steady") return "blue";
    if (m === "emerging") return "yellow";
    return "gray";
  };

  const renderTrendCard = (trend: Record<string, unknown>, i: number) => (
    <OutputCard key={i}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium">{trend.name as string}</p>
        {trend.momentum && <OutputBadge label={trend.momentum as string} color={momentumColor(trend.momentum as string)} />}
      </div>
      {trend.description && <p className="text-sm text-muted-foreground mb-2">{trend.description as string}</p>}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        {trend.timeToImpact && <span>Impact: {trend.timeToImpact as string}</span>}
        {trend.relevanceScore != null && (
          <div className="flex items-center gap-1.5 flex-1">
            <span>Relevance:</span>
            <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Number(trend.relevanceScore)}%` }} />
            </div>
            <span>{trend.relevanceScore as number}%</span>
          </div>
        )}
      </div>
      {(trend.implications as string[])?.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Implications</p>
          <OutputList items={trend.implications as string[]} />
        </div>
      )}
      {(trend.signalsOfChange as string[])?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Signals of Change</p>
          <OutputList items={trend.signalsOfChange as string[]} color="text-blue-600 dark:text-blue-400" />
        </div>
      )}
    </OutputCard>
  );

  return (
    <div>
      <SkillForm skillName="Trend Radar" skillDescription="Identify and track macro and micro trends across your industry with momentum analysis and strategic implications." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Industry" required>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., SaaS, FinTech, Healthcare" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Scope">
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="macro-trends">Macro Trends</option>
              <option value="micro-trends">Micro Trends</option>
              <option value="both">Both</option>
            </select>
          </FormField>
          <FormField label="Time Horizon">
            <select value={timeHorizon} onChange={(e) => setTimeHorizon(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="6-months">6 Months</option>
              <option value="1-year">1 Year</option>
              <option value="3-years">3 Years</option>
              <option value="5-years">5 Years</option>
            </select>
          </FormField>
        </div>
        <FormField label="Focus Lens">
          <select value={focusLens} onChange={(e) => setFocusLens(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">All</option>
            <option value="technology">Technology</option>
            <option value="market">Market</option>
            <option value="regulation">Regulation</option>
            <option value="consumer-behavior">Consumer Behavior</option>
          </select>
        </FormField>
        <FormField label="Existing Knowledge">
          <textarea value={existingKnowledge} onChange={(e) => setExistingKnowledge(e.target.value)} placeholder="Trends you already track or know about..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Radar Summary */}
          {output.radarSummary && (
            <OutputCard>
              <p className="text-sm">{output.radarSummary as string}</p>
            </OutputCard>
          )}

          {/* Macro Trends */}
          {macroTrends.length > 0 && (
            <OutputSection title="Macro Trends">
              <div className="grid gap-3">{macroTrends.map(renderTrendCard)}</div>
            </OutputSection>
          )}

          {/* Micro Trends */}
          {microTrends.length > 0 && (
            <OutputSection title="Micro Trends">
              <div className="grid gap-3">{microTrends.map(renderTrendCard)}</div>
            </OutputSection>
          )}

          {/* Convergences */}
          {convergences.length > 0 && (
            <OutputSection title="Convergences">
              <div className="grid gap-3">
                {convergences.map((c, i) => (
                  <OutputCard key={i}>
                    <p className="text-sm font-medium">{c.title as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.insight as string}</p>
                    {(c.connectedTrends as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(c.connectedTrends as string[]).map((t, j) => (
                          <OutputBadge key={j} label={t} color="purple" />
                        ))}
                      </div>
                    )}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Blind Spots */}
          {blindSpots.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Blind Spots</h5>
              <OutputList items={blindSpots} color="text-amber-700 dark:text-amber-400" />
            </div>
          )}

          {/* Strategic Implications */}
          {strategicImplications.length > 0 && (
            <OutputSection title="Strategic Implications">
              <ol className="space-y-1">
                {strategicImplications.map((imp, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="font-medium text-muted-foreground shrink-0">{i + 1}.</span>
                    {imp}
                  </li>
                ))}
              </ol>
            </OutputSection>
          )}

          {/* Recommended Watches */}
          {recommendedWatches.length > 0 && (
            <OutputSection title="Recommended Watches">
              <OutputList items={recommendedWatches} />
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
