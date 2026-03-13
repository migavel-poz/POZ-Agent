import { NextRequest, NextResponse } from "next/server";
import { updateTeamMember, deleteTeamMember } from "@/lib/db/team";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const member = updateTeamMember(Number(id), body);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = deleteTeamMember(Number(id));
  if (!success) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
