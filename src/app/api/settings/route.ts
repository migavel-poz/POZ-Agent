import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setMultipleSettings } from "@/lib/db/settings";

export async function GET() {
  const settings = getAllSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  setMultipleSettings(body);
  const settings = getAllSettings();
  return NextResponse.json(settings);
}
