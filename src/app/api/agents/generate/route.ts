import { NextRequest, NextResponse } from "next/server";
import { generateSkillOutput } from "@/lib/agents/generate";
import { SkillId } from "@/lib/agents/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, inputs } = body;

    if (!skillId || !inputs) {
      return NextResponse.json(
        { error: "skillId and inputs are required" },
        { status: 400 }
      );
    }

    const result = await generateSkillOutput({
      skillId: skillId as SkillId,
      inputs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent generation error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
