import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates, createTemplate } from "@/lib/db/templates";

export async function GET() {
  const templates = getAllTemplates();
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, post_type, system_prompt, user_prompt_template, example_output, is_default, created_by } = body;

  if (!name || !post_type || !system_prompt || !user_prompt_template) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const template = createTemplate({ name, post_type, system_prompt, user_prompt_template, example_output, is_default, created_by });
  return NextResponse.json(template, { status: 201 });
}
