import { NextResponse } from "next/server";
import { listAgentsWithPresence } from "@/lib/data";

export async function GET() {
  const agents = await listAgentsWithPresence();
  return NextResponse.json({ agents });
}
