import { NextRequest, NextResponse } from "next/server";
import { getAllOutputs, createOutput } from "@/lib/db/agent-outputs";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const outputs = getAllOutputs({
      agent_id: params.get("agent_id") || undefined,
      skill_id: params.get("skill_id") || undefined,
      status: params.get("status") || undefined,
      created_by: params.get("created_by") ? Number(params.get("created_by")) : undefined,
      search: params.get("search") || undefined,
    });
    return NextResponse.json(outputs);
  } catch (error) {
    console.error("Error fetching agent outputs:", error);
    return NextResponse.json({ error: "Failed to fetch outputs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, skill_id, title, input_params, output_json, created_by } = body;

    if (!agent_id || !skill_id || !title || !input_params || !output_json || !created_by) {
      return NextResponse.json(
        { error: "agent_id, skill_id, title, input_params, output_json, and created_by are required" },
        { status: 400 }
      );
    }

    const output = createOutput({
      agent_id,
      skill_id,
      title,
      input_params: typeof input_params === "string" ? input_params : JSON.stringify(input_params),
      output_json: typeof output_json === "string" ? output_json : JSON.stringify(output_json),
      created_by,
    });

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    console.error("Error creating agent output:", error);
    return NextResponse.json({ error: "Failed to create output" }, { status: 500 });
  }
}
