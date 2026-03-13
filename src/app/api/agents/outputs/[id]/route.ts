import { NextRequest, NextResponse } from "next/server";
import { getOutputById, updateOutput, deleteOutput } from "@/lib/db/agent-outputs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const output = getOutputById(Number(id));
    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json(output);
  } catch (error) {
    console.error("Error fetching output:", error);
    return NextResponse.json({ error: "Failed to fetch output" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const output = updateOutput(Number(id), body);
    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json(output);
  } catch (error) {
    console.error("Error updating output:", error);
    return NextResponse.json({ error: "Failed to update output" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteOutput(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting output:", error);
    return NextResponse.json({ error: "Failed to delete output" }, { status: 500 });
  }
}
