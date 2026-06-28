import { NextResponse } from "next/server";
import { listAgents } from "@/lib/data";

export async function GET() {
  const agents = await listAgents();
  return NextResponse.json({ agents });
}
