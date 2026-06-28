"use client";

import { VISUAL_STATE_META } from "@/lib/types";
import type { AgentWithPresence } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentSpriteProps {
  agent: AgentWithPresence;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Sprite pixel-art del agente. Renderiza el emoji del agente sobre
 * una "base" de personaje con efecto de glow según su visual_state.
 *
 * La animación CSS (.sprite-*) se aplica según el visual_state del presence.
 */
export function AgentSprite({ agent, onClick, compact }: AgentSpriteProps) {
  const state = agent.presence?.state ?? agent.visual_state ?? "idle";
  const meta = VISUAL_STATE_META[state];
  const spriteClass = `sprite-${state}`;

  const glowClass =
    state === "error"
      ? "glow-error"
      : state === "syncing"
      ? "glow-syncing"
      : ["working", "writing", "executing", "researching"].includes(state)
      ? "glow-working"
      : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-end select-none",
        "transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md",
        compact ? "w-14" : "w-20"
      )}
      title={`${agent.name} — ${meta.label}`}
      aria-label={`${agent.name} is ${meta.label}`}
    >
      {/* Badge de estado encima del sprite */}
      {!compact && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-pixel whitespace-nowrap"
          style={{
            background: `rgba(${hexToRgb(meta.color)}, 0.18)`,
            color: meta.color,
            border: `1px solid rgba(${hexToRgb(meta.color)}, 0.35)`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{ background: meta.color }}
          />
          {meta.label}
        </div>
      )}

      {/* Cuerpo del sprite */}
      <div
        className={cn(
          "relative rounded-lg flex items-center justify-center pixel-sprite crt-flicker",
          compact ? "w-12 h-12 text-2xl" : "w-16 h-16 text-4xl",
          spriteClass,
          glowClass
        )}
        style={{
          background:
            state === "error"
              ? "linear-gradient(180deg, rgba(239,68,68,0.15), rgba(239,68,68,0.04))"
              : state === "offline"
              ? "linear-gradient(180deg, rgba(100,116,139,0.1), rgba(100,116,139,0.02))"
              : `linear-gradient(180deg, rgba(${hexToRgb(meta.color)}, 0.12), rgba(${hexToRgb(meta.color)}, 0.03))`,
          border: `1px solid rgba(${hexToRgb(meta.color)}, 0.25)`,
        }}
      >
        <span className="leading-none">{agent.avatar_emoji}</span>

        {/* Indicador de departamento (punto colorido abajo) */}
        {agent.department?.color && !compact && (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background: agent.department.color,
              boxShadow: `0 0 6px ${agent.department.color}`,
            }}
          />
        )}
      </div>

      {/* Nombre */}
      <span
        className={cn(
          "mt-1.5 text-foreground/80 font-pixel text-center truncate w-full",
          compact ? "text-[8px]" : "text-[10px]"
        )}
      >
        {agent.name}
      </span>
    </button>
  );
}

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m) return "255,255,255";
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}
