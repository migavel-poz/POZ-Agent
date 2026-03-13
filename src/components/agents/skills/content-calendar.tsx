"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function ContentCalendarSkill() {
  const { currentUser } = useUser();
  const [timeframe, setTimeframe] = useState("1 week");
  const [postsPerWeek, setPostsPerWeek] = useState("5");
  const [topics, setTopics] = useState("");
  const [platforms, setPlatforms] = useState("LinkedIn");
  const [brandContext, setBrandContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!topics) { toast.error("Please enter topics"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "content-calendar", inputs: { timeframe, postsPerWeek, topics, platforms, brandContext } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Content calendar generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "content-authority", skill_id: "content-calendar", title, input_params: JSON.stringify({ timeframe, postsPerWeek, topics, platforms, brandContext }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const entries = (output?.entries as Array<Record<string, string>>) || [];
  const themes = (output?.themes as string[]) || [];
  const weekly = (output?.weeklyBreakdown as Array<Record<string, unknown>>) || [];

  return (
    <div>
      <SkillForm skillName="Content Calendar Planning" skillDescription="Plan publishing frequency, topic rotation, and thematic content calendars." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Timeframe" required>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>1 week</option><option>2 weeks</option><option>1 month</option>
            </select>
          </FormField>
          <FormField label="Posts per Week">
            <select value={postsPerWeek} onChange={(e) => setPostsPerWeek(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>3</option><option>5</option><option>7</option>
            </select>
          </FormField>
        </div>
        <FormField label="Core Topics / Themes" required>
          <textarea value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="e.g., AI automation, thought leadership, case studies, industry trends" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Platforms">
          <input value={platforms} onChange={(e) => setPlatforms(e.target.value)} placeholder="LinkedIn, Twitter/X, Blog" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Brand Context">
          <textarea value={brandContext} onChange={(e) => setBrandContext(e.target.value)} placeholder="Brand voice, positioning notes..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {themes.map((t, i) => <OutputBadge key={i} label={t} color="blue" />)}
            </div>
          )}
          {weekly.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {weekly.map((w, i) => (
                <OutputCard key={i} title={`Week ${w.week}`}>
                  <p className="text-sm">{w.focus as string}</p>
                  <p className="text-xs text-muted-foreground mt-1">{w.postCount as number} posts</p>
                </OutputCard>
              ))}
            </div>
          )}
          {entries.length > 0 && (
            <OutputSection title="Calendar Entries">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-4">Date</th><th className="text-left py-2 pr-4">Platform</th><th className="text-left py-2 pr-4">Topic</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Brief</th></tr></thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{e.date}</td>
                        <td className="py-2 pr-4">{e.platform}</td>
                        <td className="py-2 pr-4">{e.topic}</td>
                        <td className="py-2 pr-4"><OutputBadge label={e.postType} color="purple" /></td>
                        <td className="py-2 text-muted-foreground">{e.brief}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OutputSection>
          )}
          {output.notes && <OutputSection title="Strategic Notes"><p className="text-sm">{output.notes as string}</p></OutputSection>}
        </SkillOutput>
      )}
    </div>
  );
}
