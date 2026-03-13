"use client";
import { useState } from "react";
import { SkillForm, FormField } from "@/components/agents/skill-form";
import { SkillOutput, OutputSection, OutputList, OutputBadge, OutputCard } from "@/components/agents/skill-output";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

export default function OpportunityMappingSkill() {
  const { currentUser } = useUser();
  const [market, setMarket] = useState("");
  const [currentOffering, setCurrentOffering] = useState("");
  const [competitiveLandscape, setCompetitiveLandscape] = useState("");
  const [customerPainPoints, setCustomerPainPoints] = useState("");
  const [constraints, setConstraints] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!market) { toast.error("Please enter a market"); return; }
    if (!currentOffering) { toast.error("Please describe your current offering"); return; }
    if (!customerPainPoints) { toast.error("Please enter customer pain points"); return; }
    setGenerating(true); setSaved(false);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: "opportunity-mapping", inputs: { market, currentOffering, competitiveLandscape, customerPainPoints, constraints } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOutput(await res.json());
      toast.success("Opportunity map generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  };

  const save = async (title: string) => {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: "market-intelligence", skill_id: "opportunity-mapping", title, input_params: JSON.stringify({ market, currentOffering, competitiveLandscape, customerPainPoints, constraints }), output_json: JSON.stringify(output), created_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const prioritizedOpportunities = (output?.prioritizedOpportunities as Array<Record<string, unknown>>) || [];
  const whiteSpaceOpportunities = (output?.whiteSpaceOpportunities as Array<Record<string, unknown>>) || [];
  const threats = (output?.threats as Array<Record<string, unknown>>) || [];
  const risks = (output?.risks as Array<Record<string, unknown>>) || [];

  const feasibilityColor = (f: string): "green" | "yellow" | "red" | "gray" => {
    if (f === "high") return "green";
    if (f === "medium") return "yellow";
    if (f === "low") return "red";
    return "gray";
  };

  const investmentColor = (inv: string): "green" | "yellow" | "red" | "gray" => {
    if (inv === "low") return "green";
    if (inv === "medium") return "yellow";
    if (inv === "high") return "red";
    return "gray";
  };

  const likelihoodColor = (l: string): "red" | "yellow" | "gray" => {
    if (l === "high") return "red";
    if (l === "medium") return "yellow";
    return "gray";
  };

  return (
    <div>
      <SkillForm skillName="Opportunity Mapping" skillDescription="Identify white-space opportunities, prioritize market gaps, and map threats and risks." onGenerate={generate} generating={generating} hasOutput={!!output}>
        <FormField label="Market" required>
          <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="e.g., Enterprise SaaS, B2B Payments" className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </FormField>
        <FormField label="Current Offering" required>
          <textarea value={currentOffering} onChange={(e) => setCurrentOffering(e.target.value)} placeholder="Describe your current product or service offering..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Competitive Landscape">
          <textarea value={competitiveLandscape} onChange={(e) => setCompetitiveLandscape(e.target.value)} placeholder="Key competitors and their positioning..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
        <FormField label="Customer Pain Points" required>
          <textarea value={customerPainPoints} onChange={(e) => setCustomerPainPoints(e.target.value)} placeholder="Key problems and unmet needs of your customers..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
        </FormField>
        <FormField label="Constraints">
          <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Budget, timeline, team, or technical constraints..." className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
        </FormField>
      </SkillForm>

      {output && (
        <SkillOutput output={output} onSave={save} saving={saving} saved={saved}>
          {/* Opportunity Summary */}
          {output.opportunitySummary && (
            <OutputCard>
              <p className="text-sm">{output.opportunitySummary as string}</p>
            </OutputCard>
          )}

          {/* Strategic Recommendation highlighted */}
          {output.strategicRecommendation && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-1">Strategic Recommendation</h5>
              <p className="text-sm">{output.strategicRecommendation as string}</p>
            </div>
          )}

          {/* Prioritized Opportunities */}
          {prioritizedOpportunities.length > 0 && (
            <OutputSection title="Prioritized Opportunities">
              <div className="grid gap-3">
                {prioritizedOpportunities.map((opp, i) => (
                  <OutputCard key={i}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold text-primary shrink-0">#{opp.rank as number || i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opp.title as string}</p>
                        <p className="text-sm text-muted-foreground mt-1">{opp.description as string}</p>
                        {opp.rationale && <p className="text-sm mt-2"><span className="font-medium">Rationale:</span> {opp.rationale as string}</p>}
                        {opp.nextStep && <p className="text-sm text-primary mt-1 font-medium">Next Step: {opp.nextStep as string}</p>}
                      </div>
                    </div>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* White Space Opportunities */}
          {whiteSpaceOpportunities.length > 0 && (
            <OutputSection title="White Space Opportunities">
              <div className="grid gap-3">
                {whiteSpaceOpportunities.map((ws, i) => (
                  <OutputCard key={i}>
                    <p className="text-sm font-medium">{ws.title as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{ws.description as string}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ws.marketSize && <span className="text-xs text-muted-foreground">Market: {ws.marketSize as string}</span>}
                      {ws.competitorCoverage && <OutputBadge label={`Coverage: ${ws.competitorCoverage}`} color={ws.competitorCoverage === "none" ? "green" : ws.competitorCoverage === "low" ? "yellow" : "red"} />}
                      {ws.feasibility && <OutputBadge label={`Feasibility: ${ws.feasibility}`} color={feasibilityColor(ws.feasibility as string)} />}
                      {ws.timeToMarket && <span className="text-xs text-muted-foreground">TTM: {ws.timeToMarket as string}</span>}
                      {ws.requiredInvestment && <OutputBadge label={`Investment: ${ws.requiredInvestment}`} color={investmentColor(ws.requiredInvestment as string)} />}
                    </div>
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Threats - red bordered */}
          {threats.length > 0 && (
            <OutputSection title="Threats">
              <div className="grid gap-3">
                {threats.map((threat, i) => (
                  <OutputCard key={i} className="border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium">{threat.title as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{threat.description as string}</p>
                    <div className="flex gap-2 mt-2">
                      {threat.likelihood && <OutputBadge label={`Likelihood: ${threat.likelihood}`} color={likelihoodColor(threat.likelihood as string)} />}
                      {threat.impact && <OutputBadge label={`Impact: ${threat.impact}`} color={likelihoodColor(threat.impact as string)} />}
                    </div>
                    {threat.mitigation && <p className="text-sm mt-2"><span className="font-medium">Mitigation:</span> {threat.mitigation as string}</p>}
                  </OutputCard>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Risks - amber bordered */}
          {risks.length > 0 && (
            <OutputSection title="Risks">
              <div className="grid gap-3">
                {risks.map((risk, i) => (
                  <OutputCard key={i} className="border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium">{risk.title as string}</p>
                    <p className="text-sm text-muted-foreground mt-1">{risk.description as string}</p>
                    {risk.severity && (
                      <div className="mt-2">
                        <OutputBadge label={`Severity: ${risk.severity}`} color={risk.severity === "high" ? "red" : risk.severity === "medium" ? "yellow" : "gray"} />
                      </div>
                    )}
                    {risk.mitigation && <p className="text-sm mt-2"><span className="font-medium">Mitigation:</span> {risk.mitigation as string}</p>}
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
