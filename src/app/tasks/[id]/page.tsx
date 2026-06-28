import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import { listTasksWithRelations, listTaskEvents } from "@/lib/data";
import { PRIORITY_META, TASK_STATUS_META } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const tasks = await listTasksWithRelations();
  return tasks.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tasks = await listTasksWithRelations();
  const t = tasks.find((x) => x.id === id);
  return { title: t ? `${t.title} — Botardo OS` : "Botardo OS" };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tasks = await listTasksWithRelations();
  const task = tasks.find((t) => t.id === id);
  if (!task) notFound();

  const events = (await listTaskEvents(50)).filter((e) => e.task_id === task.id);
  const statusMeta = TASK_STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="font-pixel text-[10px]"
                style={{ color: statusMeta.color, borderColor: `${statusMeta.color}55`, background: statusMeta.bg }}
              >
                {statusMeta.label}
              </Badge>
              <Badge
                variant="outline"
                className="font-pixel text-[10px]"
                style={{ color: priorityMeta.color, borderColor: `${priorityMeta.color}55` }}
              >
                P{task.priority} · {priorityMeta.label}
              </Badge>
            </div>
            <h1 className="text-base font-semibold text-foreground leading-snug">
              {task.title}
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              #{task.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {task.description && (
            <section className="glass rounded-lg p-4">
              <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
                Descripción
              </h2>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </section>
          )}

          {task.human_feedback && (
            <section className="glass rounded-lg p-4 border-l-2" style={{ borderLeftColor: "#f59e0b" }}>
              <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
                Feedback humano
              </h2>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap italic">
                {task.human_feedback}
              </p>
            </section>
          )}

          <section className="glass rounded-lg p-4">
            <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-3">
              Auditoría · {events.length} eventos
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin eventos.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="text-sm border-l-2 border-white/10 pl-3 py-1">
                    <div className="text-foreground/90">{e.message}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {e.event_type} · {relativeTime(e.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <section className="glass rounded-lg p-4 space-y-3">
            <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground">
              Info
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3 h-3 text-muted-foreground" />
              {task.assigned_agent ? (
                <span>
                  {task.assigned_agent.avatar_emoji}{" "}
                  <Link
                    href={`/agents/${task.assigned_agent.slug}`}
                    className="hover:underline text-primary"
                  >
                    {task.assigned_agent.name}
                  </Link>
                </span>
              ) : (
                <span className="text-muted-foreground italic">Sin asignar</span>
              )}
            </div>
            {task.department && (
              <Link
                href={`/departments/${task.department.slug}`}
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: task.department.color ?? "#fff" }}
              >
                <span>{task.department.icon}</span>
                <span>{task.department.name}</span>
              </Link>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Started: {task.started_at ? relativeTime(task.started_at) : "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Due: {task.due_date ? relativeTime(task.due_date) : "—"}</span>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
