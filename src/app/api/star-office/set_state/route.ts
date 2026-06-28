import { NextRequest, NextResponse } from "next/server";
import { setAgentPresence, listAgents } from "@/lib/data";
import type { VisualState, AgentZone } from "@/lib/types";

/**
 * POST /api/star-office/set_state
 * Shape compatible con el frontend original de Star-Office-UI:
 *   Request:  { state: string, detail: string }
 *   Response: { status: "ok" } | { status: "error", msg: string }
 *
 * El frontend envía el state ("idle"|"writing"|"syncing"|"error"|...)
 * y un detail (texto descriptivo). Mapeamos al agente principal.
 *
 * Mapeo state → zone (consistente con el endpoint /agents):
 *   idle       → rest
 *   writing    → desk
 *   researching→ desk
 *   executing  → desk
 *   syncing    → desk
 *   error      → bug_zone
 */
const STATE_TO_ZONE: Record<string, AgentZone> = {
  idle: "rest",
  writing: "desk",
  researching: "desk",
  executing: "desk",
  syncing: "desk",
  error: "bug_zone",
  working: "desk", // alias
  run: "desk",
  running: "desk",
  sync: "desk",
  research: "desk",
};

export async function POST(req: NextRequest) {
  let body: { state?: string; detail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", msg: "invalid json" },
      { status: 400 }
    );
  }

  if (!body.state) {
    return NextResponse.json(
      { status: "error", msg: "state is required" },
      { status: 400 }
    );
  }

  const state = body.state as VisualState;
  const zone = STATE_TO_ZONE[body.state] ?? "desk";

  // Tomar el primer agente activo (main agent = Star)
  const agents = await listAgents();
  const main = agents.find((a) => a.active) ?? agents[0];
  if (!main) {
    return NextResponse.json(
      { status: "error", msg: "no main agent available" },
      { status: 404 }
    );
  }

  const result = await setAgentPresence({
    agent_id: main.id,
    state,
    zone,
  });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", msg: result.error ?? "unknown error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
