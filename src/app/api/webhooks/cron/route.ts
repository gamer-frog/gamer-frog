import { NextRequest, NextResponse } from "next/server";
import { handleCronWebhook } from "@/lib/data";
import type { CronWebhookPayload } from "@/lib/types";

/**
 * POST /api/webhooks/cron
 * Recibe reportes de los cron jobs de z.ai.
 * Body: { agent_slug, event_type, task_id?, message?, payload? }
 */
export async function POST(req: NextRequest) {
  let body: CronWebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.agent_slug || !body.event_type) {
    return NextResponse.json(
      { ok: false, error: "agent_slug and event_type are required" },
      { status: 400 }
    );
  }

  const validEvents = ["started", "progress", "completed", "failed"];
  if (!validEvents.includes(body.event_type)) {
    return NextResponse.json(
      { ok: false, error: `event_type must be one of: ${validEvents.join(", ")}` },
      { status: 400 }
    );
  }

  const result = await handleCronWebhook(body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/cron",
    method: "POST",
    schema: {
      agent_slug: "string (required)",
      event_type: '"started" | "progress" | "completed" | "failed" (required)',
      task_id: "string (optional)",
      message: "string (optional)",
      payload: "object (optional)",
    },
  });
}
