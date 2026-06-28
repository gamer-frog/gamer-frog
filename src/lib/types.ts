// ============================================================
// Botardo OS / Mission Control — Tipos TypeScript
// Espejan 1:1 el schema de Supabase ya creado por el usuario.
// ============================================================

export type VisualState =
  | "idle"
  | "working"
  | "researching"
  | "writing"
  | "executing"
  | "syncing"
  | "error"
  | "offline";

export type AgentZone = "desk" | "rest" | "bug_zone" | "meeting" | "offline";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "review"
  | "done"
  | "cancelled";

export type TaskPriority = 1 | 2 | 3 | 4; // 1=critical, 2=high, 3=normal, 4=low

export type TaskSource = "manual" | "cron" | "github" | "agent" | "webhook";

export type CronEventType = "started" | "progress" | "completed" | "failed";

export type Provider = "zai" | "openai" | "anthropic" | "google" | "mistral" | "custom";

// ---------- Tablas ----------

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  department_id: string | null;
  provider: Provider;
  model: string;
  description: string | null;
  avatar_emoji: string;
  visual_state: VisualState;
  active: boolean;
  github_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  assigned_agent_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  github_path: string | null;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  human_feedback: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskEvent {
  id: string;
  task_id: string | null;
  agent_id: string | null;
  event_type: string;
  message: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentPresence {
  id: string;
  agent_id: string;
  state: VisualState;
  zone: AgentZone;
  current_task_id: string | null;
  heartbeat_at: string | null;
  extra: Record<string, unknown> | null;
  updated_at: string;
}

export interface DailyMemo {
  id: string;
  memo_date: string; // YYYY-MM-DD
  department_id: string | null;
  markdown: string;
  generated_by: string | null;
  created_at: string;
}

export interface CronJob {
  id: string;
  name: string;
  slug: string;
  agent_id: string | null;
  schedule: string;
  provider: Provider;
  last_run_at: string | null;
  last_status: CronEventType | null;
  last_output: string | null;
  active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ---------- Derivados (joins úiles para UI) ----------

export interface AgentWithPresence extends Agent {
  department?: Pick<Department, "id" | "name" | "slug" | "color" | "icon"> | null;
  presence?: AgentPresence | null;
  current_task?: Pick<Task, "id" | "title" | "status" | "priority"> | null;
}

export interface TaskWithRelations extends Task {
  department?: Pick<Department, "id" | "name" | "slug" | "color" | "icon"> | null;
  assigned_agent?: Pick<Agent, "id" | "name" | "slug" | "avatar_emoji"> | null;
  events?: TaskEvent[];
}

export interface StarOfficeStatus {
  total_agents: number;
  working: number;
  idle: number;
  error: number;
  offline: number;
  meeting: number;
  last_sync: string;
}

export interface CronWebhookPayload {
  agent_slug: string;
  event_type: CronEventType;
  task_id?: string;
  message?: string;
  payload?: Record<string, unknown>;
}

// ---------- Helpers de etiquetas ----------

export const VISUAL_STATE_META: Record<
  VisualState,
  { label: string; color: string; emoji: string; description: string }
> = {
  idle: { label: "Idle", color: "#64748b", emoji: "💤", description: "Disponible, esperando trabajo" },
  working: { label: "Working", color: "#10b981", emoji: "⚡", description: "Ejecutando tarea" },
  researching: { label: "Researching", color: "#3b82f6", emoji: "🔍", description: "Investigando / leyendo" },
  writing: { label: "Writing", color: "#a855f7", emoji: "✍️", description: "Redactando contenido" },
  executing: { label: "Executing", color: "#f59e0b", emoji: "⚙️", description: "Corriendo acción externa" },
  syncing: { label: "Syncing", color: "#06b6d4", emoji: "🔄", description: "Sincronizando con GitHub/Supabase" },
  error: { label: "Error", color: "#ef4444", emoji: "🔥", description: "Falló la última acción" },
  offline: { label: "Offline", color: "#475569", emoji: "🛑", description: "No responde" },
};

export const ZONE_META: Record<AgentZone, { label: string; color: string; description: string }> = {
  desk: { label: "Desk", color: "#10b981", description: "En su escritorio trabajando" },
  rest: { label: "Rest", color: "#64748b", description: "En zona de descanso" },
  bug_zone: { label: "Bug Zone", color: "#ef4444", description: "Atrapado en un bug" },
  meeting: { label: "Meeting", color: "#06b6d4", description: "En reunión / sincronizando" },
  offline: { label: "Offline", color: "#475569", description: "No disponible" },
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: "Pending", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: "◯" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "◐" },
  blocked: { label: "Blocked", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "✕" },
  review: { label: "Review", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "◐" },
  done: { label: "Done", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "●" },
  cancelled: { label: "Cancelled", color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: "⊘" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  1: { label: "Critical", color: "#ef4444" },
  2: { label: "High", color: "#f59e0b" },
  3: { label: "Normal", color: "#3b82f6" },
  4: { label: "Low", color: "#64748b" },
};
