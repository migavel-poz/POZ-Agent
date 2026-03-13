"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function AeoAuditSkill() {
  const { currentUser } = useUser();
  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [keyQueries, setKeyQueries] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!brandName) { toast.error("Please enter a brand name"); return; }
    if (!keyQueries) { toast.error("Please enter key queries"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "aeo-audit", inputs: { brandName, brandUrl, keyQueries, competitors, platforms } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("AEO audit completed!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "aeo-audit", title, input_params: JSON.stringify({ brandName, brandUrl, keyQueries, competitors, platforms }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const overallScore = output?.overallScore as number | undefined;
  const scorecard = (output?.scorecard as Array<Record<string, any>>) || [];
  const platformScores = (output?.platformScores as Array<Record<string, any>>) || [];
  const queryAnalysis = (output?.queryAnalysis as Array<Record<string, any>>) || [];
  const gapAnalysis = output?.gapAnalysis as Record<string, any> | undefined;
  const competitorComparison = (output?.competitorComparison as Array<Record<string, any>>) || [];
  const recommendations = (output?.recommendations as Array<Record<string, any>>) || [];

  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(new Set());
  const toggleQuery = (i: number) => {
    setExpandedQueries((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const priorityColor = (p: string): "red" | "yellow" | "gray" => {
    if (p === "critical") return "red";
    if (p === "high") return "yellow";
    return "gray";
  };

  const getString = (value: unknown): string | undefined => (
    typeof value === "string" ? value : undefined
  );

  const getNumber = (value: unknown): number | undefined => (
    typeof value === "number" ? value : undefined
  );

  const getStringArray = (value: unknown): string[] => (
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
  );

  return (
    <div>
      <SkillForm skillName="AEO (AI Engine Optimization) Audit" skillDescription="Audit your brand visibility and accuracy across AI-powered search engines and assistants." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Brand Name" required>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., Your Brand" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Brand URL">
          <input value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)} placeholder="https://yourbrand.com" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Key Queries" required>
          <textarea value={keyQueries} onChange={(e) => setKeyQueries(e.target.value)} placeholder="Queries users might ask AI about your space, one per line..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Competitors">
          <textarea value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Competitor names, one per line..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
        <FormField label="Platforms">
          <textarea value={platforms} onChange={(e) => setPlatforms(e.target.value)} placeholder="chatgpt, gemini, perplexity, claude, bing-copilot" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Overall Score */}
          {overallScore != null && (
            <OutputCard>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{overallScore}<span className="text-lg text-muted-foreground font-normal">/100</span></div>
                <div>
                  <p className="text-sm font-medium">Overall AEO Score</p>
                  <p className="text-xs text-muted-foreground">Across all platforms and queries</p>
                </div>
              </div>
            </OutputCard>
          )}

          {/* Scorecard - 5 metrics */}
          {scorecard.length > 0 && (
            <OutputSection title="Scorecard">
              <div className="grid gap-3">
                {scorecard.map((metric, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 shrink-0 capitalize">{metric.name as string}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Number(metric.score)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{metric.score as number}</span>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Platform Scores comparison table */}
          {platformScores.length > 0 && (
            <OutputSection title="Platform Scores">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Platform</th>
                      <th className="text-left py-2 pr-4">Score</th>
                      <th className="text-left py-2 pr-4">Visibility</th>
                      <th className="text-left py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformScores.map((ps, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium">{ps.platform as string}</td>
                        <td className="py-2 pr-4">{ps.score as number}/100</td>
                        <td className="py-2 pr-4">{ps.visibility as string}</td>
                        <td className="py-2 text-muted-foreground">{ps.notes as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OutputSection>
          )}

          {/* Query Analysis expandable rows */}
          {queryAnalysis.length > 0 && (
            <OutputSection title="Query Analysis">
              <div className="space-y-2">
                {queryAnalysis.map((qa, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleQuery(i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {qa.brandMentioned === true ? (
                          <span className="text-green-600 dark:text-green-400 font-bold">&#10003;</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-bold">&#10007;</span>
                        )}
                        <span className="font-medium">{getString(qa.query) || "Untitled query"}</span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${expandedQueries.has(i) ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {expandedQueries.has(i) && (
                      <div className="px-3 pb-3 text-sm space-y-1 border-t pt-2">
                        {getNumber(qa.position) != null && <p><span className="font-medium">Position:</span> {getNumber(qa.position)}</p>}
                        {typeof qa.context === "string" && <p><span className="font-medium">Context:</span> {qa.context}</p>}
                        {getStringArray(qa.competitorsMentioned).length > 0 && (
                          <div>
                            <span className="font-medium">Competitors Mentioned: </span>
                            {getStringArray(qa.competitorsMentioned).join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Gap Analysis */}
          {gapAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(gapAnalysis.strengths as string[])?.length > 0 && (
                <OutputCard title="Strengths">
                  <OutputList items={gapAnalysis.strengths as string[]} color="text-green-600 dark:text-green-400" />
                </OutputCard>
              )}
              {(gapAnalysis.gaps as string[])?.length > 0 && (
                <OutputCard title="Gaps">
                  <OutputList items={gapAnalysis.gaps as string[]} color="text-red-600 dark:text-red-400" />
                </OutputCard>
              )}
              {(gapAnalysis.opportunities as string[])?.length > 0 && (
                <OutputCard title="Opportunities">
                  <OutputList items={gapAnalysis.opportunities as string[]} color="text-blue-600 dark:text-blue-400" />
                </OutputCard>
              )}
            </div>
          )}

          {/* Competitor Comparison table */}
          {competitorComparison.length > 0 && (
            <OutputSection title="Competitor Comparison">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Competitor</th>
                      <th className="text-left py-2 pr-4">Score</th>
                      <th className="text-left py-2 pr-4">Visibility</th>
                      <th className="text-left py-2">Key Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorComparison.map((cc, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium">{cc.name as string}</td>
                        <td className="py-2 pr-4">{cc.score as number}/100</td>
                        <td className="py-2 pr-4">{cc.visibility as string}</td>
                        <td className="py-2 text-muted-foreground">{cc.keyAdvantage as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OutputSection>
          )}

          {/* Recommendations priority-sorted */}
          {recommendations.length > 0 && (
            <OutputSection title="Recommendations">
              <div className="space-y-2">
                {[...recommendations]
                  .sort((a, b) => {
                    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (order[(a.priority as string) || "low"] || 3) - (order[(b.priority as string) || "low"] || 3);
                  })
                  .map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <OutputBadge label={rec.priority as string} color={priorityColor(rec.priority as string)} />
                      <span>{rec.recommendation as string}</span>
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
