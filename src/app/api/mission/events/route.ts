import { NextRequest, NextResponse } from "next/server";
import { listTaskEvents } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const task_id = searchParams.get("task_id");
  let events = await listTaskEvents(limit);
  if (task_id) events = events.filter((e) => e.task_id === task_id);
  return NextResponse.json({ events });
}
