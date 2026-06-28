import { NextRequest, NextResponse } from "next/server";
import { handleCronWebhook } from "@/lib/data";
import { isDuplicateEvent, verifyWebhookAuth } from "@/lib/webhook-utils";
import type { CronWebhookPayload } from "@/lib/types";

/**
 * POST /api/webhooks/cron
 *
 * Recibe reportes de los cron jobs de z.ai.
 * Body: { agent_slug, event_type, task_id?, message?, payload? }
 *
 * Seguridad:
 * - Si CRON_WEBHOOK_SECRET está seteado, requiere auth header.
 * - Idempotente: dedupe por (agent_id + event_type + message) en 5s.
 *
 * Respuestas:
 * - 200: procesado OK
 * - 202: duplicado descartado (idempotencia)
 * - 401: auth requerida / inválida
 * - 400: payload inválido
 * - 503: modo demo, no se persiste
 * - 500: error interno
 */
export async function POST(req: NextRequest) {
  // 1) Auth SIEMPRE primero (incluso antes de parsear body)
  //    Así un attacker no puede consumir recursos parseando JSON sin auth.
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Set Authorization: Bearer <CRON_WEBHOOK_SECRET> or X-Webhook-Secret header." },
      { status: 401 }
    );
  }

  // 2) Parse body
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

  // 3) Idempotencia: dedupe dentro de ventana de 5s
  if (
    isDuplicateEvent({
      agent_id: body.agent_slug,
      event_type: body.event_type,
      message: body.message,
      task_id: body.task_id,
    })
  ) {
    return NextResponse.json(
      { ok: true, deduped: true, msg: "Event already processed in dedup window" },
      { status: 202 }
    );
  }

  // 4) Procesar (puede fallar con 503 si es modo demo)
  const result = await handleCronWebhook(body);
  if (!result.ok) {
    const isDemoError = result.error?.startsWith("Modo DEMO");
    return NextResponse.json(result, { status: isDemoError ? 503 : 500 });
  }
  return NextResponse.json(result, { status: 200 });
}

export async function GET() {
  const authRequired = Boolean(process.env.CRON_WEBHOOK_SECRET);
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/cron",
    method: "POST",
    auth_required: authRequired,
    auth_header: authRequired ? "Authorization: Bearer <secret> or X-Webhook-Secret: <secret>" : "none (set CRON_WEBHOOK_SECRET to enable)",
    dedup_window_ms: 5000,
    schema: {
      agent_slug: "string (required)",
      event_type: '"started" | "progress" | "completed" | "failed" (required)',
      task_id: "string (optional)",
      message: "string (optional)",
      payload: "object (optional)",
    },
  });
}
