import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db/posts";

export async function GET() {
  const stats = getDashboardStats();
  return NextResponse.json(stats);
}
