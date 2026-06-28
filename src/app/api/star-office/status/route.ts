import { NextResponse } from "next/server";
import { getStarOfficeStatus, listAgentsWithPresence, getYesterdayMemo } from "@/lib/data";
import type { AgentWithPresence, VisualState } from "@/lib/types";

/**
 * GET /api/star-office/status
 * Shape compatible con el frontend original de Star-Office-UI:
 *   { state: "idle"|"writing"|"researching"|"executing"|"syncing"|"error",
 *     detail: string,
 *     progress: number,
 *     updated_at: ISO-string,
 *     officeName?: string }
 *
 * El frontend mapea `state` → sprite/area en el canvas.
 * Toma el primer agente activo como "main agent" (Star).
 */
export async function GET() {
  const [agents, _status, memo] = await Promise.all([
    listAgentsWithPresence(),
    getStarOfficeStatus(),
    getYesterdayMemo(),
  ]);

  // El "main agent" = primer agente activo (Botardo Prime por convención del seed)
  const main = agents.find((a) => a.active) ?? agents[0] ?? null;

  if (!main) {
    return NextResponse.json({
      state: "idle" as VisualState,
      detail: "Sin agentes activos",
      progress: 0,
      updated_at: new Date().toISOString(),
      officeName: "Botardo OS",
    });
  }

  const state = (main.presence?.state ?? main.visual_state ?? "idle") as VisualState;
  const detail =
    main.current_task?.title ??
    ({ idle: "待命中", writing: "正在整理文档", researching: "搜索信息中",
       executing: "执行任务中", syncing: "同步备份中",
       error: "出错了，排查中" } as Record<VisualState, string>)[state];

  return NextResponse.json({
    state,
    detail,
    progress: 0, // el frontend no lo lee, lo dejamos para compat
    updated_at: main.presence?.heartbeat_at ?? main.updated_at,
    officeName: "Botardo OS",
  });
}
