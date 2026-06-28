import { NextResponse } from "next/server";
import { listAgentsWithPresence } from "@/lib/data";
import type { AgentZone, VisualState } from "@/lib/types";

/**
 * GET /api/star-office/agents
 * Shape compatible con el frontend original de Star-Office-UI:
 *   Array<{ agentId, name, isMain, state, detail, area, authStatus, updated_at }>
 *
 * - `area` ∈ {breakroom, writing, researching, error} es lo que posiciona el sprite.
 * - `authStatus` ∈ {approved, pending, rejected, offline} controla color/transparencia.
 * - `isMain:true` se ignora para el render de guests (Star se dibuja vía /status).
 *
 * Mapeo zone (nuestro schema) → area (Star-Office-UI):
 *   desk      → writing    (todos los estados "working" van al escritorio)
 *   rest      → breakroom  (idle al sofá)
 *   bug_zone  → error      (error a la zona de bugs)
 *   meeting   → writing    (caer al escritorio por defecto)
 *   offline   → breakroom  (lugar seguro)
 */
const ZONE_TO_AREA: Record<AgentZone, "breakroom" | "writing" | "researching" | "error"> = {
  desk: "writing",
  rest: "breakroom",
  bug_zone: "error",
  meeting: "writing",
  offline: "breakroom",
};

const STATE_TO_AREA: Record<VisualState, "breakroom" | "writing" | "researching" | "error"> = {
  idle: "breakroom",
  working: "writing",
  writing: "writing",
  researching: "researching",
  executing: "writing",
  syncing: "writing",
  error: "error",
  offline: "breakroom",
};

export async function GET() {
  const agents = await listAgentsWithPresence();

  const payload = agents.map((a, idx) => {
    const state = (a.presence?.state ?? a.visual_state ?? "idle") as VisualState;
    const zone = (a.presence?.zone ?? "desk") as AgentZone;

    // Preferencia: zone explícita > state-derived
    const area = ZONE_TO_AREA[zone] ?? STATE_TO_AREA[state];

    const authStatus = !a.active
      ? "offline"
      : state === "error"
      ? "rejected" // el frontend original pinta "rejected" en rojo, "pending" semi-transparente
      : "approved";

    const detail =
      a.current_task?.title ??
      a.description ??
      `${a.name} · ${state}`;

    return {
      agentId: a.id,
      name: a.name,
      isMain: idx === 0, // el primero es el "Star" principal
      state,
      detail,
      area,
      authStatus,
      updated_at: a.presence?.heartbeat_at ?? a.updated_at,
      // Extra fields que el frontend puede usar (no rompen el contrato)
      avatar_emoji: a.avatar_emoji,
      department: a.department?.name ?? null,
    };
  });

  return NextResponse.json(payload);
}
