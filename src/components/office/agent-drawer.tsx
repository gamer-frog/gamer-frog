"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bug,
  Clock,
  Cpu,
  ExternalLink,
  Github,
  X,
  Zap,
} from "lucide-react";
import type { AgentWithPresence, TaskEvent } from "@/lib/types";
import { VISUAL_STATE_META, ZONE_META } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentDrawerProps {
  agent: AgentWithPresence | null;
  open: boolean;
  onClose: () => void;
  events?: TaskEvent[];
}

export function AgentDrawer({ agent, open, onClose, events = [] }: AgentDrawerProps) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !agent) return null;

  const state = agent.presence?.state ?? agent.visual_state;
  const stateMeta = VISUAL_STATE_META[state];
  const zone = agent.presence?.zone ?? "desk";
  const zoneMeta = ZONE_META[zone];
  const agentEvents = events
    .filter((e) => e.agent_id === agent.id)
    .slice(0, 12);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50",
          "bg-sidebar border-l border-sidebar-border",
          "shadow-2xl flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-sidebar-border">
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{
                background: `linear-gradient(135deg, rgba(${hexToRgb(stateMeta.color)}, 0.2), rgba(${hexToRgb(stateMeta.color)}, 0.05))`,
                border: `1px solid rgba(${hexToRgb(stateMeta.color)}, 0.3)`,
              }}
            >
              {agent.avatar_emoji}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{agent.slug}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] font-pixel"
                  style={{
                    color: stateMeta.color,
                    borderColor: `rgba(${hexToRgb(stateMeta.color)}, 0.4)`,
                    background: `rgba(${hexToRgb(stateMeta.color)}, 0.08)`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-1 pulse-dot"
                    style={{ background: stateMeta.color }}
                  />
                  {stateMeta.label}
                </Badge>
                {agent.department && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-pixel"
                    style={{
                      color: agent.department.color ?? "#fff",
                      borderColor: `rgba(${hexToRgb(agent.department.color ?? "#fff")}, 0.4)`,
                    }}
                  >
                    {agent.department.icon} {agent.department.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Descripción */}
            {agent.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {agent.description}
              </p>
            )}

            {/* Estado actual */}
            <section className="glass rounded-lg p-4 space-y-3">
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                Estado actual
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-0.5">
                    State
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: stateMeta.color }}>{stateMeta.emoji}</span>
                    <span className="font-medium">{stateMeta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stateMeta.description}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-0.5">
                    Zone
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: zoneMeta.color }}>●</span>
                    <span className="font-medium">{zoneMeta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {zoneMeta.description}
                  </p>
                </div>
              </div>
              {agent.presence?.heartbeat_at && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-white/5">
                  <Clock className="w-3 h-3" />
                  Heartbeat: {relativeTime(agent.presence.heartbeat_at)}
                </div>
              )}
            </section>

            {/* Tarea actual */}
            {agent.current_task && (
              <section className="glass rounded-lg p-4 space-y-2">
                <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Tarea actual
                </h3>
                <div className="text-sm font-medium text-foreground">
                  {agent.current_task.title}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-[10px]">
                    {agent.current_task.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    Prioridad {agent.current_task.priority}
                  </span>
                </div>
              </section>
            )}

            {/* Metadata técnica */}
            <section className="glass rounded-lg p-4 space-y-2">
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                Stack
              </h3>
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
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Github className="w-3 h-3" />
                  {agent.github_path}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </section>

            {/* Últimos eventos */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bug className="w-3 h-3" />
                Últimos eventos
              </h3>
              {agentEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Sin eventos recientes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {agentEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="text-xs glass rounded-md p-2.5 flex items-start gap-2"
                    >
                      <span
                        className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background:
                            ev.event_type === "failed"
                              ? "#ef4444"
                              : ev.event_type === "completed"
                              ? "#10b981"
                              : ev.event_type === "started"
                              ? "#3b82f6"
                              : "#a855f7",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground/90">{ev.message}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {ev.event_type} · {relativeTime(ev.created_at)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </ScrollArea>
      </aside>
    </>
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
