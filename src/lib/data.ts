// ============================================================
// Capa de datos unificada. Si Supabase está configurado, lee
// de ahí. Si no, cae al mock data. Las API routes y los
// Server Components consumen exclusivamente este módulo.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MOCK_AGENTS,
  MOCK_CRON_JOBS,
  MOCK_DEPARTMENTS,
  MOCK_MEMOS,
  MOCK_PRESENCE,
  MOCK_TASK_EVENTS,
  MOCK_TASKS,
} from "@/lib/mock-data";
import type {
  Agent,
  AgentPresence,
  AgentWithPresence,
  CronJob,
  DailyMemo,
  Department,
  StarOfficeStatus,
  Task,
  TaskEvent,
  TaskWithRelations,
  VisualState,
  AgentZone,
  TaskStatus,
  TaskPriority,
} from "@/lib/types";

// ---------- Departments ----------

export async function listDepartments(): Promise<Department[]> {
  if (!isSupabaseConfigured()) return MOCK_DEPARTMENTS;
  const supabase = await createClient();
  if (!supabase) return MOCK_DEPARTMENTS;
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error || !data) return MOCK_DEPARTMENTS;
  return data as Department[];
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_DEPARTMENTS.find((d) => d.slug === slug) ?? null;
  }
  const supabase = await createClient();
  if (!supabase) return MOCK_DEPARTMENTS.find((d) => d.slug === slug) ?? null;
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Department;
}

// ---------- Agents ----------

export async function listAgents(): Promise<Agent[]> {
  if (!isSupabaseConfigured()) return MOCK_AGENTS;
  const supabase = await createClient();
  if (!supabase) return MOCK_AGENTS;
  const { data, error } = await supabase.from("agents").select("*").order("name");
  if (error || !data) return MOCK_AGENTS;
  return data as Agent[];
}

export async function listAgentsWithPresence(): Promise<AgentWithPresence[]> {
  const [agents, presence, departments, tasks] = await Promise.all([
    listAgents(),
    listPresence(),
    listDepartments(),
    listTasks(),
  ]);

  const depMap = new Map(departments.map((d) => [d.id, d]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return agents.map((a) => {
    const p = presence.find((x) => x.agent_id === a.id) ?? null;
    return {
      ...a,
      department: a.department_id ? depMap.get(a.department_id) ?? null : null,
      presence: p,
      current_task:
        p?.current_task_id && taskMap.has(p.current_task_id)
          ? {
              id: taskMap.get(p!.current_task_id!)!.id,
              title: taskMap.get(p!.current_task_id!)!.title,
              status: taskMap.get(p!.current_task_id!)!.status as TaskStatus,
              priority: taskMap.get(p!.current_task_id!)!.priority as TaskPriority,
            }
          : null,
    };
  });
}

export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_AGENTS.find((a) => a.slug === slug) ?? null;
  }
  const supabase = await createClient();
  if (!supabase) return MOCK_AGENTS.find((a) => a.slug === slug) ?? null;
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Agent;
}

// ---------- Presence ----------

export async function listPresence(): Promise<AgentPresence[]> {
  if (!isSupabaseConfigured()) return MOCK_PRESENCE;
  const supabase = await createClient();
  if (!supabase) return MOCK_PRESENCE;
  const { data, error } = await supabase.from("agent_presence").select("*");
  if (error || !data) return MOCK_PRESENCE;
  return data as AgentPresence[];
}

export async function setAgentPresence(input: {
  agent_id: string;
  state?: VisualState;
  zone?: AgentZone;
  current_task_id?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    // mock: solo log, no persiste
    return { ok: true };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: true };
  const patch: Record<string, unknown> = {
    heartbeat_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (input.state) patch.state = input.state;
  if (input.zone) patch.zone = input.zone;
  if (input.current_task_id !== undefined) patch.current_task_id = input.current_task_id;

  // upsert por agent_id
  const { error } = await supabase
    .from("agent_presence")
    .update(patch)
    .eq("agent_id", input.agent_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------- Tasks ----------

export async function listTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured()) return MOCK_TASKS;
  const supabase = await createClient();
  if (!supabase) return MOCK_TASKS;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return MOCK_TASKS;
  return data as Task[];
}

export async function listTasksWithRelations(): Promise<TaskWithRelations[]> {
  const [tasks, departments, agents] = await Promise.all([
    listTasks(),
    listDepartments(),
    listAgents(),
  ]);
  const depMap = new Map(departments.map((d) => [d.id, d]));
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  return tasks.map((t) => ({
    ...t,
    department: t.department_id ? depMap.get(t.department_id) ?? null : null,
    assigned_agent: t.assigned_agent_id
      ? agentMap.get(t.assigned_agent_id) ?? null
      : null,
  }));
}

export async function getTaskById(id: string): Promise<TaskWithRelations | null> {
  const tasks = await listTasksWithRelations();
  return tasks.find((t) => t.id === id) ?? null;
}

export async function patchTask(
  id: string,
  patch: Partial<Pick<Task, "status" | "priority" | "human_feedback" | "assigned_agent_id" | "title" | "description">>
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: true };
  const supabase = await createClient();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createTask(input: {
  title: string;
  description?: string;
  department_id?: string | null;
  assigned_agent_id?: string | null;
  priority?: TaskPriority;
  source?: Task["source"];
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, id: `mock-${Date.now()}` };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: true, id: `mock-${Date.now()}` };
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description ?? null,
      department_id: input.department_id ?? null,
      assigned_agent_id: input.assigned_agent_id ?? null,
      priority: input.priority ?? 3,
      source: input.source ?? "manual",
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

// ---------- Task Events ----------

export async function listTaskEvents(limit = 50): Promise<TaskEvent[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_TASK_EVENTS]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, limit);
  }
  const supabase = await createClient();
  if (!supabase) return MOCK_TASK_EVENTS;
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return MOCK_TASK_EVENTS;
  return data as TaskEvent[];
}

export async function appendTaskEvent(input: {
  task_id?: string | null;
  agent_id?: string | null;
  event_type: string;
  message: string;
  payload?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: true };
  const supabase = await createClient();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from("task_events").insert({
    task_id: input.task_id ?? null,
    agent_id: input.agent_id ?? null,
    event_type: input.event_type,
    message: input.message,
    payload: input.payload ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------- Star Office aggregated ----------

export async function getStarOfficeStatus(): Promise<StarOfficeStatus> {
  const agents = await listAgentsWithPresence();
  const working = agents.filter(
    (a) =>
      a.presence?.state &&
      ["working", "writing", "researching", "executing", "syncing"].includes(a.presence.state)
  ).length;
  const idle = agents.filter((a) => a.presence?.state === "idle").length;
  const error = agents.filter((a) => a.presence?.state === "error").length;
  const offline = agents.filter(
    (a) => a.presence?.state === "offline" || !a.active
  ).length;
  const meeting = agents.filter((a) => a.presence?.zone === "meeting").length;
  return {
    total_agents: agents.length,
    working,
    idle,
    error,
    offline,
    meeting,
    last_sync: new Date().toISOString(),
  };
}

// ---------- Daily memos ----------

export async function getYesterdayMemo(): Promise<DailyMemo | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_MEMOS[0] ?? null;
  }
  const supabase = await createClient();
  if (!supabase) return MOCK_MEMOS[0] ?? null;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_memos")
    .select("*")
    .eq("memo_date", yesterday)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return MOCK_MEMOS[0] ?? null;
  return data as DailyMemo;
}

// ---------- Cron jobs ----------

export async function listCronJobs(): Promise<CronJob[]> {
  if (!isSupabaseConfigured()) return MOCK_CRON_JOBS;
  const supabase = await createClient();
  if (!supabase) return MOCK_CRON_JOBS;
  const { data, error } = await supabase.from("cron_jobs").select("*").order("name");
  if (error || !data) return MOCK_CRON_JOBS;
  return data as CronJob[];
}

// ---------- Cron webhook handler ----------

export async function handleCronWebhook(payload: {
  agent_slug: string;
  event_type: "started" | "progress" | "completed" | "failed";
  task_id?: string;
  message?: string;
  payload?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const agents = await listAgents();
  const agent = agents.find((a) => a.slug === payload.agent_slug);
  if (!agent) return { ok: false, error: `Agent not found: ${payload.agent_slug}` };

  // Map event_type -> visual_state + zone
  const stateMap: Record<string, { state: VisualState; zone: AgentZone }> = {
    started: { state: "working", zone: "desk" },
    progress: { state: "working", zone: "desk" },
    completed: { state: "idle", zone: "rest" },
    failed: { state: "error", zone: "bug_zone" },
  };
  const next = stateMap[payload.event_type] ?? { state: "working", zone: "desk" };

  const presenceResult = await setAgentPresence({
    agent_id: agent.id,
    state: next.state,
    zone: next.zone,
    current_task_id: payload.task_id ?? null,
  });
  if (!presenceResult.ok) return presenceResult;

  const eventResult = await appendTaskEvent({
    task_id: payload.task_id ?? null,
    agent_id: agent.id,
    event_type: payload.event_type,
    message: payload.message ?? `Cron ${payload.event_type}`,
    payload: payload.payload ?? null,
  });
  if (!eventResult.ok) return eventResult;

  // Si completó o falló una task vinculada, actualizar la task
  if (payload.task_id && (payload.event_type === "completed" || payload.event_type === "failed")) {
    await patchTask(payload.task_id, {
      status: payload.event_type === "completed" ? "done" : "blocked",
    });
  }

  return { ok: true };
}
