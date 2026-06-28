"use client";

import { Calendar, Clock, MessageSquare, User } from "lucide-react";
import type { TaskWithRelations } from "@/lib/types";
import { PRIORITY_META, TASK_STATUS_META } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const statusMeta = TASK_STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];

  const hasFeedback = Boolean(task.human_feedback?.trim());

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left group rounded-lg border border-white/5 bg-white/[0.015]",
        "hover:border-white/15 hover:bg-white/[0.04] transition-all",
        "p-3 relative overflow-hidden"
      )}
    >
      {/* Barra de prioridad lateral */}
      <span
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: priorityMeta.color }}
      />

      <div className="flex items-start gap-2">
        {/* Status icon */}
        <span
          className="font-mono text-sm leading-none mt-0.5 flex-shrink-0"
          style={{ color: statusMeta.color }}
          title={statusMeta.label}
        >
          {statusMeta.icon}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground/95 leading-snug line-clamp-2 group-hover:text-foreground">
              {task.title}
            </h4>
            {hasFeedback && (
              <MessageSquare
                className="w-3 h-3 text-accent flex-shrink-0 mt-0.5"
                aria-label="Tiene feedback humano"
              />
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[9px] font-pixel py-0 h-4"
              style={{
                color: statusMeta.color,
                borderColor: `${statusMeta.color}40`,
                background: statusMeta.bg,
              }}
            >
              {statusMeta.label}
            </Badge>
            {task.department && (
              <Badge
                variant="outline"
                className="text-[9px] font-pixel py-0 h-4"
                style={{
                  color: task.department.color ?? "#fff",
                  borderColor: `${task.department.color ?? "#fff"}40`,
                }}
              >
                {task.department.icon} {task.department.name}
              </Badge>
            )}
            {task.assigned_agent && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {task.assigned_agent.avatar_emoji} {task.assigned_agent.name}
              </span>
            )}
            {task.due_date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="w-2.5 h-2.5" />
                {relativeTime(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const future = diff > 0;
  const s = Math.floor(abs / 1000);
  if (s < 60) return future ? `en ${s}s` : `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return future ? `en ${m}m` : `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return future ? `en ${h}h` : `hace ${h}h`;
  const d = Math.floor(h / 24);
  return future ? `en ${d}d` : `hace ${d}d`;
}
