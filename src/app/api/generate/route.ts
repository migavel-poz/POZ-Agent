import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/ai/generate";
import { PostType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { topic, post_type, additional_context } = body;

  if (!topic || !post_type) {
    return NextResponse.json({ error: "Missing required fields: topic, post_type" }, { status: 400 });
  }

  try {
    const result = await generatePost({
      topic,
      postType: post_type as PostType,
      additionalContext: additional_context,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
