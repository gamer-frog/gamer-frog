"use client";

import { Activity, Loader2 } from "lucide-react";
import type { TaskEvent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  events: TaskEvent[];
  loading?: boolean;
  agents?: Array<{ id: string; name: string; avatar_emoji: string }>;
}

const EVENT_STYLES: Record<string, { color: string; label: string }> = {
  started: { color: "#3b82f6", label: "Started" },
  progress: { color: "#a855f7", label: "Progress" },
  completed: { color: "#10b981", label: "Completed" },
  failed: { color: "#ef4444", label: "Failed" },
  human_edit: { color: "#f59e0b", label: "Human" },
};

export function ActivityFeed({ events, loading, agents = [] }: ActivityFeedProps) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <div className="glass rounded-lg flex flex-col h-full max-h-[600px]">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground">
          Activity feed
        </h3>
        {loading && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin ml-auto" />}
      </header>

      <ScrollArea className="flex-1">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground italic">
            Sin actividad reciente.
          </div>
        ) : (
          <ul className="p-3 space-y-1.5">
            {events.map((ev, idx) => {
              const style = EVENT_STYLES[ev.event_type] ?? {
                color: "#94a3b8",
                label: ev.event_type,
              };
              const agent = ev.agent_id ? agentMap.get(ev.agent_id) : null;
              return (
                <li
                  key={ev.id}
                  className={cn(
                    "relative pl-5 pr-2 py-2 rounded-md hover:bg-white/[0.02] transition-colors",
                    "group"
                  )}
                >
                  {/* Timeline dot */}
                  <span
                    className="absolute left-1.5 top-3 w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: style.color,
                      boxShadow: `0 0 6px ${style.color}80`,
                    }}
                  />
                  {/* Vertical line */}
                  {idx < events.length - 1 && (
                    <span
                      className="absolute left-[9px] top-5 bottom-[-6px] w-px"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  )}

                  <div className="text-xs text-foreground/90 leading-snug">
                    {ev.message}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                    <span style={{ color: style.color }}>{style.label}</span>
                    {agent && (
                      <span>
                        {agent.avatar_emoji} {agent.name}
                      </span>
                    )}
                    <span className="ml-auto">{relativeTime(ev.created_at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
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
