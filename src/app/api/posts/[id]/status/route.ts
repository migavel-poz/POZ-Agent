import { NextRequest, NextResponse } from "next/server";
import { getPostById, transitionPostStatus } from "@/lib/db/posts";
import { canTransition } from "@/lib/workflow";
import { PostStatus } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { status: newStatus, changed_by, note } = body;

  if (!newStatus || !changed_by) {
    return NextResponse.json({ error: "Missing required fields: status, changed_by" }, { status: 400 });
  }

  const post = getPostById(Number(id));
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (!canTransition(post.status, newStatus as PostStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${post.status}' to '${newStatus}'` },
      { status: 400 }
    );
  }

  const updated = transitionPostStatus(Number(id), newStatus as PostStatus, changed_by, note);
  return NextResponse.json(updated);
}
