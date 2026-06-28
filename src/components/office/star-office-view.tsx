"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Bug,
  Coffee,
  LayoutGrid,
  Loader2,
  Users,
  Video,
  WifiOff,
} from "lucide-react";
import { usePoll } from "@/hooks/use-poll";
import { AgentSprite } from "@/components/office/agent-sprite";
import { AgentDrawer } from "@/components/office/agent-drawer";
import { MemoBanner } from "@/components/office/memo-banner";
import type { AgentWithPresence, DailyMemo, TaskEvent } from "@/lib/types";

interface OfficeData {
  agents: AgentWithPresence[];
}

interface EventsData {
  events: TaskEvent[];
}

interface MemoData {
  memo: DailyMemo | null;
}

interface ZoneDef {
  key: "desk" | "rest" | "bug_zone" | "meeting" | "offline";
  label: string;
  icon: typeof Bug;
  color: string;
  bgClass: string;
  description: string;
}

const ZONES: ZoneDef[] = [
  {
    key: "desk",
    label: "Desks",
    icon: LayoutGrid,
    color: "#10b981",
    bgClass: "zone-desk",
    description: "Trabajando en su escritorio",
  },
  {
    key: "meeting",
    label: "Meeting Room",
    icon: Video,
    color: "#06b6d4",
    bgClass: "zone-meeting",
    description: "En reunión o sincronizando",
  },
  {
    key: "rest",
    label: "Rest Area",
    icon: Coffee,
    color: "#64748b",
    bgClass: "zone-rest",
    description: "Descansando / idle",
  },
  {
    key: "bug_zone",
    label: "Bug Zone",
    icon: Bug,
    color: "#ef4444",
    bgClass: "zone-bug",
    description: "Atrapado con un bug",
  },
];

export function StarOfficeView() {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithPresence | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const officeFetcher = useCallback(async () => {
    const r = await fetch("/api/star-office/agents");
    if (!r.ok) throw new Error("Failed to fetch agents");
    const j = (await r.json()) as OfficeData;
    return j;
  }, []);

  const eventsFetcher = useCallback(async () => {
    const r = await fetch("/api/mission/events?limit=30");
    if (!r.ok) throw new Error("Failed to fetch events");
    return (await r.json()) as EventsData;
  }, []);

  const memoFetcher = useCallback(async () => {
    const r = await fetch("/api/star-office/yesterday-memo");
    if (!r.ok) throw new Error("Failed to fetch memo");
    return (await r.json()) as MemoData;
  }, []);

  const { data: officeData, loading: agentsLoading } = usePoll<OfficeData>(
    officeFetcher,
    { intervalMs: 8000 }
  );
  const { data: eventsData } = usePoll<EventsData>(eventsFetcher, {
    intervalMs: 12000,
  });
  const { data: memoData, loading: memoLoading } = usePoll<MemoData>(memoFetcher, {
    intervalMs: 60000,
  });

  const agents = officeData?.agents ?? [];

  const agentsByZone = useMemo(() => {
    const map: Record<string, AgentWithPresence[]> = {
      desk: [],
      rest: [],
      bug_zone: [],
      meeting: [],
      offline: [],
    };
    for (const a of agents) {
      const z = a.presence?.zone ?? "desk";
      (map[z] ?? map.desk).push(a);
    }
    return map;
  }, [agents]);

  const stats = useMemo(() => {
    const total = agents.length;
    const working = agents.filter((a) => {
      const s = a.presence?.state ?? a.visual_state;
      return (
        s === "working" ||
        s === "writing" ||
        s === "researching" ||
        s === "executing" ||
        s === "syncing"
      );
    }).length;
    const idle = agents.filter(
      (a) => (a.presence?.state ?? a.visual_state) === "idle"
    ).length;
    const error = agents.filter(
      (a) => (a.presence?.state ?? a.visual_state) === "error"
    ).length;
    const offline = agents.filter(
      (a) => (a.presence?.state ?? a.visual_state) === "offline" || !a.active
    ).length;
    return { total, working, idle, error, offline };
  }, [agents]);

  const handleAgentClick = (a: AgentWithPresence) => {
    setSelectedAgent(a);
    setDrawerOpen(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-110px)] space-y-4">
      {/* Memo banner */}
      <MemoBanner memo={memoData?.memo ?? null} loading={memoLoading && !memoData} />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatChip label="Total" value={stats.total} color="#94a3b8" icon={Users} />
        <StatChip
          label="Working"
          value={stats.working}
          color="#10b981"
          icon={LayoutGrid}
        />
        <StatChip label="Idle" value={stats.idle} color="#64748b" icon={Coffee} />
        <StatChip label="Error" value={stats.error} color="#ef4444" icon={Bug} />
        <StatChip
          label="Offline"
          value={stats.offline}
          color="#475569"
          icon={WifiOff}
        />
      </div>

      {/* Office canvas */}
      <div
        className="relative rounded-xl border border-white/10 overflow-hidden scanlines crt-flicker"
        style={{
          minHeight: 540,
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)",
        }}
      >
        {/* Pixel grid backdrop */}
        <div className="absolute inset-0 pixel-grid opacity-50" />

        {agentsLoading && agents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground font-pixel">
              Cargando oficina…
            </span>
          </div>
        ) : (
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
            {ZONES.map((zone) => (
              <ZonePanel
                key={zone.key}
                zone={zone}
                agents={agentsByZone[zone.key] ?? []}
                onAgentClick={handleAgentClick}
              />
            ))}

            {/* Offline zone — banda lateral inferior */}
            {(agentsByZone.offline ?? []).length > 0 && (
              <div className="lg:col-span-2 mt-2">
                <ZonePanel
                  zone={{
                    key: "offline",
                    label: "Offline",
                    icon: WifiOff,
                    color: "#475569",
                    bgClass: "zone-rest",
                    description: "No disponibles",
                  }}
                  agents={agentsByZone.offline}
                  onAgentClick={handleAgentClick}
                  compact
                />
              </div>
            )}
          </div>
        )}

        {/* Footer de office */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between text-[10px] font-pixel text-muted-foreground/70 bg-black/40 border-t border-white/5">
          <span>BOTARDO OS — STAR OFFICE</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            REALTIME · {agents.length} AGENTS
          </span>
        </div>
      </div>

      {/* Drawer */}
      <AgentDrawer
        agent={selectedAgent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        events={eventsData?.events ?? []}
      />
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof Bug;
}) {
  return (
    <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase text-muted-foreground truncate">
          {label}
        </div>
        <div className="font-pixel text-sm" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ZonePanel({
  zone,
  agents,
  onAgentClick,
  compact,
}: {
  zone: ZoneDef;
  agents: AgentWithPresence[];
  onAgentClick: (a: AgentWithPresence) => void;
  compact?: boolean;
}) {
  const Icon = zone.icon;
  return (
    <section
      className={`relative rounded-lg border border-white/8 ${zone.bgClass} p-4 min-h-[180px]`}
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: zone.color }} />
          <h3
            className="font-pixel text-[10px] uppercase tracking-wider"
            style={{ color: zone.color }}
          >
            {zone.label}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {agents.length}
        </span>
      </header>

      {/* Línea decorativa */}
      <div
        className="absolute left-4 right-4 h-px opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${zone.color}, transparent)`,
          top: 38,
        }}
      />

      {agents.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60 italic font-pixel">
          Vacío
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 pt-2">
          {agents.map((a) => (
            <AgentSprite
              key={a.id}
              agent={a}
              onClick={() => onAgentClick(a)}
              compact={compact}
            />
          ))}
        </div>
      )}

      <p className="absolute bottom-2 left-4 right-4 text-[9px] text-muted-foreground/60 font-pixel truncate">
        {zone.description}
      </p>
    </section>
  );
}
