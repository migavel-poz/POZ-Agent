"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function PerformanceInsightSkill() {
  const { currentUser } = useUser();
  const [postData, setPostData] = useState("");
  const [timeframe, setTimeframe] = useState("last-30-days");
  const [goals, setGoals] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!postData) { toast.error("Please paste engagement data"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "performance-insight", inputs: { postData, timeframe, goals } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Performance analysis generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "performance-insight", title, input_params: JSON.stringify({ postData: postData.substring(0, 200) + "...", timeframe, goals }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const topPosts = (output?.topPerformingPosts as Array<Record<string, string>>) || [];
  const underPosts = (output?.underPerformingPosts as Array<Record<string, string>>) || [];
  const topicPerf = (output?.topicPerformance as Array<Record<string, string>>) || [];
  const bestTimes = (output?.bestPostingTimes as string[]) || [];
  const audienceInsights = (output?.audienceInsights as string[]) || [];
  const recs = (output?.recommendations as Array<Record<string, string>>) || [];

  return (
    <div>
      <SkillForm skillName="Performance Insight" skillDescription="Analyze engagement data to identify top-performing content and optimization opportunities." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Engagement Data" required>
          <textarea value={postData} onChange={(e) => setPostData(e.target.value)} placeholder="Paste engagement data (post title, impressions, likes, comments, shares, clicks)..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]" />
        </FormField>
        <FormField label="Timeframe">
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="last-7-days">Last 7 Days</option><option value="last-30-days">Last 30 Days</option><option value="last-quarter">Last Quarter</option>
          </select>
        </FormField>
        <FormField label="Goals & Targets">
          <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="What metrics matter most? Growth targets?" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {output.summary && <OutputSection title="Executive Summary"><p className="text-sm">{output.summary as string}</p></OutputSection>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPosts.length > 0 && (
              <OutputSection title="Top Performing Posts">
                <div className="space-y-2">
                  {topPosts.map((p, i) => (
                    <OutputCard key={i} className="border-green-200 dark:border-green-800">
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">{p.metric}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.insight}</p>
                    </OutputCard>
                  ))}
                </div>
              </OutputSection>
            )}
            {underPosts.length > 0 && (
              <OutputSection title="Underperforming Posts">
                <div className="space-y-2">
                  {underPosts.map((p, i) => (
                    <OutputCard key={i} className="border-amber-200 dark:border-amber-800">
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{p.metric}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.suggestion}</p>
                    </OutputCard>
                  ))}
                </div>
              </OutputSection>
            )}
          </div>
          {topicPerf.length > 0 && (
            <OutputSection title="Topic Performance">
              <div className="space-y-1">
                {topicPerf.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span>{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t.avgEngagement}</span>
                      <OutputBadge label={t.trend} color={t.trend === "up" ? "green" : t.trend === "down" ? "red" : "gray"} />
                    </div>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
          {recs.length > 0 && (
            <OutputSection title="Recommendations">
              <div className="space-y-2">
                {recs.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <OutputBadge label={r.priority} color={r.priority === "high" ? "red" : r.priority === "medium" ? "yellow" : "gray"} />
                    <div>
                      <p className="font-medium">{r.action}</p>
                      <p className="text-xs text-muted-foreground">{r.expectedImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
          {bestTimes.length > 0 && <OutputSection title="Best Posting Times"><OutputList items={bestTimes} /></OutputSection>}
          {audienceInsights.length > 0 && <OutputSection title="Audience Insights"><OutputList items={audienceInsights} /></OutputSection>}
          {output.benchmarkComparison && <OutputSection title="Benchmark"><p className="text-sm">{output.benchmarkComparison as string}</p></OutputSection>}
        </SkillOutput>
      )}
    </div>
  );
}
