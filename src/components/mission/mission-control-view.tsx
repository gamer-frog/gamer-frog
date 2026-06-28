"use client";

import { useCallback, useMemo, useState } from "react";
import { Filter, Loader2, Plus, Search, X } from "lucide-react";
import { usePoll } from "@/hooks/use-poll";
import { useOfficeBridge } from "@/hooks/use-office-bridge";
import { useRealtime } from "@/hooks/use-realtime";
import { KpiCards } from "@/components/mission/kpi-cards";
import { TaskCard } from "@/components/mission/task-card";
import { ActivityFeed } from "@/components/mission/activity-feed";
import { AgentCard } from "@/components/mission/agent-card";
import { TaskDetailDrawer } from "@/components/mission/task-detail-drawer";
import { CreateTaskDialog } from "@/components/mission/create-task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  Agent,
  AgentWithPresence,
  Department,
  Task,
  TaskEvent,
  TaskStatus,
  TaskWithRelations,
} from "@/lib/types";

interface TasksData {
  tasks: TaskWithRelations[];
}
interface AgentsData {
  agents: Agent[];
}
interface AgentsWithPresenceData {
  agents: AgentWithPresence[];
}
interface DepartmentsData {
  departments: Department[];
}
interface EventsData {
  events: TaskEvent[];
}

const STATUS_FILTERS: Array<{ value: TaskStatus | "all"; label: string; color: string }> = [
  { value: "all", label: "All", color: "#94a3b8" },
  { value: "in_progress", label: "In Progress", color: "#3b82f6" },
  { value: "pending", label: "Pending", color: "#94a3b8" },
  { value: "blocked", label: "Blocked", color: "#ef4444" },
  { value: "review", label: "Review", color: "#f59e0b" },
  { value: "done", label: "Done", color: "#10b981" },
  { value: "cancelled", label: "Cancelled", color: "#64748b" },
];

export function MissionControlView() {
  const officeBridge = useOfficeBridge();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const tasksFetcher = useCallback(async () => {
    const r = await fetch("/api/mission/tasks");
    if (!r.ok) throw new Error("tasks");
    return (await r.json()) as TasksData;
  }, []);
  const agentsFetcher = useCallback(async () => {
    const r = await fetch("/api/mission/agents");
    if (!r.ok) throw new Error("agents");
    return (await r.json()) as AgentsData;
  }, []);
  const officeFetcher = useCallback(async () => {
    // Endpoint dedicado para Mission Control: devuelve {agents: AgentWithPresence[]}
    // (no el del office que devuelve array plano para compat con el repo original).
    const r = await fetch("/api/mission/agents-with-presence");
    if (!r.ok) throw new Error("office");
    return (await r.json()) as AgentsWithPresenceData;
  }, []);
  const deptsFetcher = useCallback(async () => {
    const r = await fetch("/api/mission/departments");
    if (!r.ok) throw new Error("depts");
    return (await r.json()) as DepartmentsData;
  }, []);
  const eventsFetcher = useCallback(async () => {
    const r = await fetch("/api/mission/events?limit=40");
    if (!r.ok) throw new Error("events");
    return (await r.json()) as EventsData;
  }, []);

  const { data: tasksData, loading: tasksLoading, refresh: refreshTasks } = usePoll<TasksData>(
    tasksFetcher,
    { intervalMs: 8000 }
  );
  const { data: agentsData } = usePoll<AgentsData>(agentsFetcher, { intervalMs: 30000 });
  const { data: officeData } = usePoll<AgentsWithPresenceData>(officeFetcher, {
    intervalMs: 15000,
  });
  const { data: deptsData } = usePoll<DepartmentsData>(deptsFetcher, { intervalMs: 60000 });
  const { data: eventsData, loading: eventsLoading } = usePoll<EventsData>(eventsFetcher, {
    intervalMs: 10000,
  });

  const tasks = tasksData?.tasks ?? [];
  const agents = agentsData?.agents ?? [];
  const officeAgents = officeData?.agents ?? [];
  const departments = deptsData?.departments ?? [];
  const events = eventsData?.events ?? [];

  // Supabase Realtime — refresca inmediatamente cuando hay cambios.
  // En modo demo es no-op (sin Supabase configurado).
  useRealtime(["tasks", "task_events", "agent_presence"], () => {
    refreshTasks();
  });
  useRealtime(["agents", "departments"], () => {
    // Estos cambian con menor frecuencia, forzamos refresco del office agents
    // que también alimenta el sidebar de agents
  });

  // KPIs (hoy)
  const kpis = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ts = startOfToday.getTime();
    const todayTasks = tasks.filter((t) => new Date(t.created_at).getTime() >= ts);
    const doneToday = todayTasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const activeAgents = officeAgents.filter((a) => a.active).length;
    return {
      doneToday,
      totalToday: todayTasks.length,
      inProgress,
      blocked,
      activeAgents,
    };
  }, [tasks, officeAgents]);

  // Aplicar filtros
  const filteredTasks = useMemo(() => {
    let r = tasks;
    if (statusFilter !== "all") r = r.filter((t) => t.status === statusFilter);
    if (selectedDepartment)
      r = r.filter((t) => t.department_id === selectedDepartment);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }
    // Ordenar por prioridad asc, luego por created_at desc
    return [...r].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [tasks, statusFilter, selectedDepartment, search]);

  // Conteo por status (para sidebar)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  // Conteo por departamento
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.department_id) counts[t.department_id] = (counts[t.department_id] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  const handleTaskClick = (t: TaskWithRelations) => {
    setSelectedTask(t);
    setDrawerOpen(true);
  };

  const handleUpdated = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  return (
    <div className="space-y-3">
      {/* KPIs */}
      <KpiCards {...kpis} />

      {/* Main grid: sidebar + content + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-3">
        {/* Sidebar — Departments + status filters */}
        <aside className="space-y-3">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground">
                Departamentos
              </h3>
            </div>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => setSelectedDepartment(null)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between",
                    selectedDepartment === null
                      ? "bg-white/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.03]"
                  )}
                >
                  <span>Todos</span>
                  <span className="text-[10px] font-mono">{tasks.length}</span>
                </button>
              </li>
              {departments.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedDepartment(d.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between",
                      selectedDepartment === d.id
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span style={{ color: d.color ?? "#fff" }}>{d.icon}</span>
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="text-[10px] font-mono">
                      {deptCounts[d.id] ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Active agents list */}
          <div className="glass rounded-lg p-3">
            <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2.5">
              Agents · {officeAgents.length}
            </h3>
            <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
              {officeAgents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Cargando…</p>
              ) : (
                officeAgents.map((a) => (
                  <AgentCard
                    key={a.id}
                    agent={a}
                    onClick={() => {
                      // Cambiar al tab "office" y pedirle al iframe que se enfoque
                      // en el agente. El bridge hace postMessage al iframe.
                      if (typeof window !== "undefined") {
                        window.location.hash = "office";
                        // Dar tiempo al iframe de montarse antes de mandar el mensaje
                        setTimeout(() => officeBridge.focusAgent(a.slug), 300);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Center — backlog */}
        <section className="space-y-3 min-w-0">
          {/* Toolbar */}
          <div className="glass rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar tareas…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nueva
              </Button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_FILTERS.map((f) => {
                const count = f.value === "all" ? tasks.length : statusCounts[f.value] ?? 0;
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-pixel uppercase tracking-wider flex items-center gap-1 transition-colors",
                      active
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03]"
                    )}
                    style={active ? { color: f.color, borderColor: `${f.color}55` } : undefined}
                  >
                    {f.label}
                    <span
                      className="text-[9px] font-mono opacity-60"
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backlog list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-pixel uppercase tracking-wider text-muted-foreground">
                Backlog
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                {filteredTasks.length} tareas
              </span>
            </div>

            {tasksLoading && tasks.length === 0 ? (
              <div className="glass rounded-lg p-8 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Cargando backlog…
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="glass rounded-lg p-8 text-center text-sm text-muted-foreground">
                No hay tareas con esos filtros.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => handleTaskClick(t)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right — activity feed */}
        <aside>
          <ActivityFeed
            events={events}
            loading={eventsLoading}
            agents={agents}
          />
        </aside>
      </div>

      {/* Drawers / Dialogs */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={handleUpdated}
        agents={agents}
      />
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refreshTasks}
        departments={departments}
        agents={agents}
        defaultDepartmentId={selectedDepartment}
      />
    </div>
  );
}
