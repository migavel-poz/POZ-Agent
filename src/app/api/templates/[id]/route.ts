import { NextRequest, NextResponse } from "next/server";
import { updateTemplate, deleteTemplate } from "@/lib/db/templates";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const template = updateTemplate(Number(id), body);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = deleteTemplate(Number(id));
  if (!success) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
