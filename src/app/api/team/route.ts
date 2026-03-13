import { NextRequest, NextResponse } from "next/server";
import { getAllTeamMembers, createTeamMember } from "@/lib/db/team";

export async function GET() {
  const members = await getAllTeamMembers();
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, role } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  const member = await createTeamMember({ name, email, role });
  return NextResponse.json(member, { status: 201 });
}
