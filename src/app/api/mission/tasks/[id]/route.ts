import { NextRequest, NextResponse } from "next/server";
import { patchTask, appendTaskEvent } from "@/lib/data";
import type { TaskStatus, TaskPriority } from "@/lib/types";

/**
 * PATCH /api/mission/tasks/[id]
 * Body: { status?, priority?, human_feedback?, assigned_agent_id?, title?, description? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: {
    status?: TaskStatus;
    priority?: TaskPriority;
    human_feedback?: string;
    assigned_agent_id?: string | null;
    title?: string;
    description?: string;
    event_message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const patch: {
    status?: TaskStatus;
    priority?: TaskPriority;
    human_feedback?: string;
    assigned_agent_id?: string | null;
    title?: string;
    description?: string;
  } = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.human_feedback !== undefined) patch.human_feedback = body.human_feedback;
  if (body.assigned_agent_id !== undefined) patch.assigned_agent_id = body.assigned_agent_id;
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;

  const result = await patchTask(id, patch);
  if (!result.ok) return NextResponse.json(result, { status: 500 });

  // Log del cambio como evento
  const changes: string[] = [];
  if (body.status) changes.push(`status→${body.status}`);
  if (body.priority) changes.push(`priority→${body.priority}`);
  if (body.assigned_agent_id !== undefined) changes.push("reassigned");
  if (body.human_feedback !== undefined) changes.push("feedback added");
  if (changes.length > 0) {
    await appendTaskEvent({
      task_id: id,
      agent_id: null,
      event_type: "human_edit",
      message: body.event_message ?? `Human edited: ${changes.join(", ")}`,
    });
  }

  return NextResponse.json(result);
}
