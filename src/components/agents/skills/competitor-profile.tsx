"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function CompetitorProfileSkill() {
  const { currentUser } = useUser();
  const [competitorName, setCompetitorName] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [knownInfo, setKnownInfo] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!competitorName) { toast.error("Please enter a competitor name"); return; }
    if (!industry) { toast.error("Please enter an industry"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "competitor-profile", inputs: { competitorName, competitorUrl, industry, knownInfo, focusAreas } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Competitor profile generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "competitor-profile", title, input_params: JSON.stringify({ competitorName, competitorUrl, industry, knownInfo, focusAreas }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const threatLevel = output?.threatLevel as string;
  const product = output?.product as Record<string, any> | undefined;
  const pricing = output?.pricing as Record<string, any> | undefined;
  const positioning = output?.positioning as Record<string, any> | undefined;
  const gtmStrategy = output?.gtmStrategy as Record<string, any> | undefined;
  const strengths = (output?.strengths as string[]) || [];
  const weaknesses = (output?.weaknesses as string[]) || [];
  const recentMoves = (output?.recentMoves as string[]) || [];
  const opportunities = (output?.opportunities as Array<Record<string, string>>) || [];

  const threatColor = (level: string): "green" | "yellow" | "red" => {
    if (level === "low") return "green";
    if (level === "medium") return "yellow";
    return "red";
  };

  return (
    <div>
      <SkillForm skillName="Competitor Profile Builder" skillDescription="Build comprehensive competitor profiles with product, pricing, positioning, and GTM analysis." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Competitor Name" required>
          <input value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} placeholder="e.g., Acme Corp" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Competitor URL">
          <input value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} placeholder="https://competitor.com" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Industry" required>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., SaaS, FinTech, Healthcare" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Known Information">
          <textarea value={knownInfo} onChange={(e) => setKnownInfo(e.target.value)} placeholder="Any existing knowledge about this competitor..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Focus Areas">
          <textarea value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} placeholder="product, pricing, positioning, gtm, team, funding, technology" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Header with company name + summary + threat level */}
          <OutputCard>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base">{output.companyName as string}</h4>
                <p className="text-sm text-muted-foreground mt-1">{output.summary as string}</p>
              </div>
              {threatLevel && <OutputBadge label={`Threat: ${threatLevel}`} color={threatColor(threatLevel)} />}
            </div>
          </OutputCard>

          {/* Product card */}
          {product && (
            <OutputCard title="Product">
              <p className="text-sm mb-2">{product.description as string}</p>
              {(product.keyFeatures as string[])?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Key Features</p>
                  <OutputList items={product.keyFeatures as string[]} />
                </div>
              )}
              {(product.differentiators as string[])?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Differentiators</p>
                  <OutputList items={product.differentiators as string[]} color="text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </OutputCard>
          )}

          {/* Pricing card */}
          {pricing && (
            <OutputCard title="Pricing">
              <p className="text-sm mb-1"><span className="font-medium">Model:</span> {pricing.model as string}</p>
              {(pricing.tiers as string[])?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tiers</p>
                  <OutputList items={pricing.tiers as string[]} />
                </div>
              )}
              {pricing.comparison && <p className="text-sm text-muted-foreground mt-2">{pricing.comparison as string}</p>}
            </OutputCard>
          )}

          {/* Positioning card */}
          {positioning && (
            <OutputCard title="Positioning">
              <p className="text-sm mb-1"><span className="font-medium">Target Market:</span> {positioning.targetMarket as string}</p>
              <p className="text-sm mb-1"><span className="font-medium">Value Proposition:</span> {positioning.valueProposition as string}</p>
              <p className="text-sm"><span className="font-medium">Messaging:</span> {positioning.messaging as string}</p>
            </OutputCard>
          )}

          {/* GTM Strategy card */}
          {gtmStrategy && (
            <OutputCard title="Go-to-Market Strategy">
              {(gtmStrategy.channels as string[])?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Channels</p>
                  <OutputList items={gtmStrategy.channels as string[]} />
                </div>
              )}
              {gtmStrategy.approach && <p className="text-sm mb-1"><span className="font-medium">Approach:</span> {gtmStrategy.approach as string}</p>}
              {(gtmStrategy.partnerships as string[])?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Partnerships</p>
                  <OutputList items={gtmStrategy.partnerships as string[]} />
                </div>
              )}
            </OutputCard>
          )}

          {/* Strengths vs Weaknesses side by side */}
          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strengths.length > 0 && (
                <OutputCard title="Strengths">
                  <OutputList items={strengths} color="text-green-600 dark:text-green-400" />
                </OutputCard>
              )}
              {weaknesses.length > 0 && (
                <OutputCard title="Weaknesses">
                  <OutputList items={weaknesses} color="text-red-600 dark:text-red-400" />
                </OutputCard>
              )}
            </div>
          )}

          {/* Recent Moves */}
          {recentMoves.length > 0 && (
            <OutputSection title="Recent Moves">
              <OutputList items={recentMoves} />
            </OutputSection>
          )}

          {/* Opportunities as action cards */}
          {opportunities.length > 0 && (
            <OutputSection title="Opportunities">
              <div className="grid gap-2">
                {opportunities.map((opp, i) => (
                  <OutputCard key={i}>
                    <p className="text-sm font-medium">{opp.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                    {opp.action && <p className="text-sm text-primary mt-1 font-medium">{opp.action}</p>}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}
        </SkillOutput>
      )}
    </div>
  );
}
