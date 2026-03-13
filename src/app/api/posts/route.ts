import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/db/posts";
import { PostStatus, PostType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: { status?: PostStatus; post_type?: PostType; author_id?: number; search?: string } = {};

  if (searchParams.get("status")) filters.status = searchParams.get("status") as PostStatus;
  if (searchParams.get("post_type")) filters.post_type = searchParams.get("post_type") as PostType;
  if (searchParams.get("author_id")) filters.author_id = Number(searchParams.get("author_id"));
  if (searchParams.get("search")) filters.search = searchParams.get("search")!;

  const posts = getAllPosts(filters);
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date } = body;

  if (!title || !content || !post_type || !author_id) {
    return NextResponse.json({ error: "Missing required fields: title, content, post_type, author_id" }, { status: 400 });
  }

  const post = createPost({ title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date });
  return NextResponse.json(post, { status: 201 });
}
