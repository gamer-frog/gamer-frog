import { NextRequest, NextResponse } from "next/server";
import { setAgentPresence } from "@/lib/data";
import type { VisualState, AgentZone } from "@/lib/types";

/**
 * POST /api/star-office/set_state
 * Body: { agent_id, state?, zone?, current_task_id? }
 */
export async function POST(req: NextRequest) {
  let body: {
    agent_id: string;
    state?: VisualState;
    zone?: AgentZone;
    current_task_id?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.agent_id) {
    return NextResponse.json(
      { ok: false, error: "agent_id is required" },
      { status: 400 }
    );
  }

  const result = await setAgentPresence({
    agent_id: body.agent_id,
    state: body.state,
    zone: body.zone,
    current_task_id: body.current_task_id,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
