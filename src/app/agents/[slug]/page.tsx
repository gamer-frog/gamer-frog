import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cpu, ExternalLink, Github } from "lucide-react";
import {
  listAgentsWithPresence,
  listTaskEvents,
  listTasksWithRelations,
} from "@/lib/data";
import { VISUAL_STATE_META } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const agents = await listAgentsWithPresence();
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agents = await listAgentsWithPresence();
  const a = agents.find((x) => x.slug === slug);
  return { title: a ? `${a.name} — Botardo OS` : "Botardo OS" };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agents = await listAgentsWithPresence();
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) notFound();

  const [allEvents, allTasks] = await Promise.all([
    listTaskEvents(20),
    listTasksWithRelations(),
  ]);
  const events = allEvents.filter((e) => e.agent_id === agent.id);
  const tasks = allTasks.filter((t) => t.assigned_agent_id === agent.id);

  const state = agent.presence?.state ?? agent.visual_state;
  const meta = VISUAL_STATE_META[state];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
              border: `1px solid rgba(${hexToRgb(meta.color)}, 0.3)`,
            }}
          >
            {agent.avatar_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{agent.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-pixel text-[10px]"
              style={{ color: meta.color, borderColor: `${meta.color}55` }}
            >
              {meta.label}
            </Badge>
            {agent.department && (
              <Badge
                variant="outline"
                className="font-pixel text-[10px]"
                style={{
                  color: agent.department.color ?? "#fff",
                  borderColor: `${agent.department.color ?? "#fff"}55`,
                }}
              >
                {agent.department.icon} {agent.department.name}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4 lg:col-span-2">
          {agent.description && (
            <section className="glass rounded-lg p-4">
              <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
                Descripción
              </h2>
              <p className="text-sm text-foreground/85 leading-relaxed">
                {agent.description}
              </p>
            </section>
          )}

          <section className="glass rounded-lg p-4">
            <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-3">
              Tareas asignadas · {tasks.length}
            </h2>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin tareas asignadas.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="text-sm border border-white/5 rounded-md p-2.5"
                  >
                    <div className="font-medium text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.status} · P{t.priority}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="glass rounded-lg p-4 space-y-2">
            <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> Stack
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground text-[10px]">Provider</div>
                <div className="font-mono">{agent.provider}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Model</div>
                <div className="font-mono">{agent.model}</div>
              </div>
            </div>
            {agent.github_path && (
              <a
                href={`https://github.com/${agent.github_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
              >
                <Github className="w-3 h-3" />
                {agent.github_path}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </section>

          <section className="glass rounded-lg p-4">
            <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
              Eventos recientes
            </h2>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin eventos.</p>
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 8).map((e) => (
                  <li key={e.id} className="text-xs">
                    <div className="text-foreground/90">{e.message}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {e.event_type} · {relativeTime(e.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m) return "255,255,255";
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
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
