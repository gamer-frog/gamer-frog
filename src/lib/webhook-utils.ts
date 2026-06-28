// ============================================================
// Cache en memoria para dedupe de eventos del webhook de cron.
// Z.ai puede reintentar POSTs (normal en cron jobs), y no queremos
// duplicar eventos en task_events ni flapear agent_presence.
//
// Estrategia: hash(agent_id + event_type + message) en ventana de 5s.
// Si llega el mismo evento dentro de la ventana, se descarta silenciosamente.
//
// En serverless (Vercel) esto se reinicia por cold start, lo cual es
// aceptable: el dedupe cubre retries inmediatos (los más comunes).
// ============================================================

interface CacheEntry {
  ts: number;
}

const DEDUP_WINDOW_MS = 5000;
const cache = new Map<string, CacheEntry>();

// Limpieza periódica para evitar memory leaks (cada 30s)
let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.ts > DEDUP_WINDOW_MS * 6) {
        cache.delete(k);
      }
    }
  }, 30000);
  // No bloquear el proceso al hacer shutdown
  if (cleanupTimer.unref) cleanupTimer.unref();
}

/**
 * Devuelve true si el evento YA fue procesado en la ventana de dedupe.
 * Llamar ANTES de persistir. Si devuelve true, skip.
 */
export function isDuplicateEvent(input: {
  agent_id: string;
  event_type: string;
  message?: string;
  task_id?: string;
}): boolean {
  ensureCleanup();
  const key = hashEvent(input);
  const now = Date.now();
  const prev = cache.get(key);
  if (prev && now - prev.ts < DEDUP_WINDOW_MS) {
    return true; // duplicado
  }
  cache.set(key, { ts: now });
  return false;
}

function hashEvent(input: {
  agent_id: string;
  event_type: string;
  message?: string;
  task_id?: string;
}): string {
  // Hash simple y determinista. No es criptográfico, solo para dedupe.
  const raw = `${input.agent_id}|${input.event_type}|${input.message ?? ""}|${input.task_id ?? ""}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) - h + raw.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

/**
 * Verifica el header Authorization contra CRON_WEBHOOK_SECRET.
 * Si la env var no está seteada, retorna true (modo dev friendly).
 * Si está seteada, requiere `Authorization: Bearer <secret>` o
 * `X-Webhook-Secret: <secret>`.
 */
export function verifyWebhookAuth(req: Request): boolean {
  const secret = process.env.CRON_WEBHOOK_SECRET;
  if (!secret) {
    // Sin secret configurado = no auth requerida (dev/demo).
    // En producción, setear CRON_WEBHOOK_SECRET.
    return true;
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const customHeader = req.headers.get("x-webhook-secret") ?? "";

  if (customHeader === secret) return true;
  if (authHeader.startsWith("Bearer ") && authHeader.slice(7) === secret) return true;

  return false;
}
