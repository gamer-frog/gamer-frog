"use client";

import { CheckCircle2, AlertTriangle, Activity, Cpu, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  doneToday: number;
  activeAgents: number;
  blocked: number;
  totalToday: number;
  inProgress: number;
}

export function KpiCards({
  doneToday,
  activeAgents,
  blocked,
  totalToday,
  inProgress,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
      <Card
        label="Done today"
        value={doneToday}
        sub={`${totalToday} total`}
        color="#10b981"
        icon={CheckCircle2}
      />
      <Card
        label="In progress"
        value={inProgress}
        sub="activas ahora"
        color="#3b82f6"
        icon={Activity}
      />
      <Card
        label="Blocked"
        value={blocked}
        sub="requieren atención"
        color="#ef4444"
        icon={AlertTriangle}
      />
      <Card
        label="Active agents"
        value={activeAgents}
        sub="online"
        color="#06b6d4"
        icon={Cpu}
      />
      <Card
        label="Velocity"
        value={totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100)}
        sub="% done today"
        color="#a855f7"
        icon={TrendingUp}
        suffix={totalToday === 0 ? "" : "%"}
      />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  color,
  icon: Icon,
  suffix = "",
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: typeof CheckCircle2;
  suffix?: string;
}) {
  return (
    <div className="glass rounded-lg p-3 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-pixel">
          {label}
        </span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn("text-2xl font-bold tabular-nums")}
          style={{ color }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-sm" style={{ color }}>
            {suffix}
          </span>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
    </div>
  );
}
