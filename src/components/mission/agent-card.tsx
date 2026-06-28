"use client";

import { Cpu, ExternalLink } from "lucide-react";
import type { AgentWithPresence } from "@/lib/types";
import { VISUAL_STATE_META } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: AgentWithPresence;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const state = agent.presence?.state ?? agent.visual_state;
  const meta = VISUAL_STATE_META[state];

  return (
    <button
      onClick={onClick}
      className={cn(
        "glass rounded-lg p-3 text-left w-full",
        "hover:bg-white/[0.05] transition-colors group",
        !agent.active && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, rgba(${hexToRgb(meta.color)}, 0.2), rgba(${hexToRgb(meta.color)}, 0.04))`,
            border: `1px solid rgba(${hexToRgb(meta.color)}, 0.25)`,
          }}
        >
          {agent.avatar_emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium text-foreground truncate">
              {agent.name}
            </h4>
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-dot"
              style={{ background: meta.color }}
              title={meta.label}
            />
          </div>
          <div className="text-[10px] text-muted-foreground font-mono truncate">
            {agent.model}
          </div>
          {agent.current_task && (
            <div className="text-xs text-foreground/70 mt-1.5 line-clamp-1 italic">
              ▸ {agent.current_task.title}
            </div>
          )}
          {agent.department && (
            <div
              className="text-[10px] font-pixel mt-1 truncate"
              style={{ color: agent.department.color ?? "#94a3b8" }}
            >
              {agent.department.icon} {agent.department.name}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m) return "255,255,255";
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}
