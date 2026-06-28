import { NextRequest, NextResponse } from "next/server";
import { listTasksWithRelations, createTask } from "@/lib/data";
import type { TaskPriority, TaskSource } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const department_id = searchParams.get("department_id");
  const assigned_agent_id = searchParams.get("assigned_agent_id");

  let tasks = await listTasksWithRelations();
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (department_id) tasks = tasks.filter((t) => t.department_id === department_id);
  if (assigned_agent_id)
    tasks = tasks.filter((t) => t.assigned_agent_id === assigned_agent_id);

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  let body: {
    title: string;
    description?: string;
    department_id?: string | null;
    assigned_agent_id?: string | null;
    priority?: TaskPriority;
    source?: TaskSource;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.title) {
    return NextResponse.json(
      { ok: false, error: "title is required" },
      { status: 400 }
    );
  }
  const result = await createTask(body);
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result, { status: 201 });
}
