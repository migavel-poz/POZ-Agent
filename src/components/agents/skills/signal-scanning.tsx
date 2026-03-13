"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function SignalScanningSkill() {
  const { currentUser } = useUser();
  const [company, setCompany] = useState("");
  const [signalTypes, setSignalTypes] = useState("");
  const [timeframe, setTimeframe] = useState("last-month");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!company) { toast.error("Please enter a company name"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "signal-scanning", inputs: { company, signalTypes, timeframe, context } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Signal scan completed!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "signal-scanning", title, input_params: JSON.stringify({ company, signalTypes, timeframe, context }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const earlyWarnings = (output?.earlyWarnings as string[]) || [];
  const signals = (output?.signals as Array<Record<string, any>>) || [];
  const patterns = (output?.patterns as Array<Record<string, any>>) || [];
  const recommendedActions = (output?.recommendedActions as string[]) || [];
  const confidenceLevel = output?.confidenceLevel as string;

  const significanceColor = (sig: string): "red" | "yellow" | "gray" => {
    if (sig === "high") return "red";
    if (sig === "medium") return "yellow";
    return "gray";
  };

  const sortedSignals = [...signals].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[(a.significance as string) || "low"] || 2) - (order[(b.significance as string) || "low"] || 2);
  });

  return (
    <div>
      <SkillForm skillName="Competitive Signal Scanning" skillDescription="Monitor and analyze competitive signals across news, job posts, earnings, social media, patents, and partnerships." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Company / Competitor" required>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Corp" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Signal Types">
          <textarea value={signalTypes} onChange={(e) => setSignalTypes(e.target.value)} placeholder="news, job-posts, earnings, social-media, patents, partnerships" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
        <FormField label="Timeframe">
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="last-week">Last Week</option>
            <option value="last-month">Last Month</option>
            <option value="last-quarter">Last Quarter</option>
          </select>
        </FormField>
        <FormField label="Additional Context">
          <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any specific areas of concern or things to watch for..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Signal Summary header card */}
          {output.signalSummary && (
            <OutputCard>
              <p className="text-sm">{output.signalSummary as string}</p>
              {confidenceLevel && (
                <div className="mt-2">
                  <OutputBadge label={`Confidence: ${confidenceLevel}`} color={confidenceLevel === "high" ? "green" : confidenceLevel === "medium" ? "yellow" : "gray"} />
                </div>
              )}
            </OutputCard>
          )}

          {/* Early Warnings alert banner */}
          {earlyWarnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Early Warnings</h5>
              <OutputList items={earlyWarnings} color="text-amber-700 dark:text-amber-400" />
            </div>
          )}

          {/* Signals as cards sorted by significance */}
          {sortedSignals.length > 0 && (
            <OutputSection title="Signals">
              <div className="grid gap-3">
                {sortedSignals.map((signal, i) => (
                  <OutputCard key={i}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">{signal.title as string}</p>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        {signal.type && <OutputBadge label={signal.type as string} color="blue" />}
                        {signal.significance && <OutputBadge label={signal.significance as string} color={significanceColor(signal.significance as string)} />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{signal.description as string}</p>
                    {signal.source && <p className="text-xs text-muted-foreground mt-1">Source: {signal.source as string}</p>}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Patterns as insight cards */}
          {patterns.length > 0 && (
            <OutputSection title="Patterns">
              <div className="grid gap-3">
                {patterns.map((pattern, i) => (
                  <OutputCard key={i}>
                    <p className="text-sm font-medium">{pattern.pattern as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pattern.insight as string}</p>
                    {(pattern.evidence as string[])?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Evidence</p>
                        <OutputList items={pattern.evidence as string[]} />
                      </div>
                    )}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Recommended Actions */}
          {recommendedActions.length > 0 && (
            <OutputSection title="Recommended Actions">
              <ol className="space-y-1">
                {recommendedActions.map((action, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="font-medium text-muted-foreground shrink-0">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ol>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
