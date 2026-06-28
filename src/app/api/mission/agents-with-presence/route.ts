import { NextResponse } from "next/server";
import { listAgentsWithPresence } from "@/lib/data";

/**
 * GET /api/mission/agents-with-presence
 *
 * Devuelve {agents: AgentWithPresence[]} para Mission Control.
 * A diferencia de /api/star-office/agents (que devuelve array plano
 * con el shape del repo original), este endpoint devuelve el shape
 * AgentWithPresence que usa el sidebar de Mission Control.
 */
export async function GET() {
  const agents = await listAgentsWithPresence();
  return NextResponse.json({ agents });
}
