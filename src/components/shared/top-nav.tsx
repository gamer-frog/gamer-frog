"use client";

import { Building2, Cpu, Github, Radio, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface TopNavProps {
  view: string;
  onViewChange: (v: string) => void;
  /** Override del flag connected (para evitar flash de hidratación).
   *  Si se omite, se calcula client-side. */
  connectedOverride?: boolean;
}

const TABS = [
  { value: "office", label: "Star Office", icon: Building2 },
  { value: "mission", label: "Mission Control", icon: Cpu },
] as const;

export function TopNav({ view, onViewChange, connectedOverride }: TopNavProps) {
  // Si el parent pasa el flag server-side, lo usamos. Sino, calculamos client-side.
  const connected = connectedOverride ?? isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-pixel text-[11px] text-foreground leading-none">
              BOTARDO OS
            </h1>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              Mission Control v1
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = view === t.value;
            return (
              <button
                key={t.value}
                onClick={() => onViewChange(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-pixel uppercase tracking-wider">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full pulse-dot",
                connected ? "bg-primary" : "bg-accent"
              )}
              title={connected ? "Conectado a Supabase" : "Modo demo (mock data, sin escritura)"}
            />
            <Radio className="w-3 h-3" />
            <span style={{ color: connected ? "var(--primary)" : "var(--accent)" }}>
              {connected ? "LIVE" : "DEMO"}
            </span>
            {!connected && (
              <span className="hidden lg:inline text-muted-foreground normal-case font-mono text-[9px] ml-1">
                · sin escritura
              </span>
            )}
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <div className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>powered by z.ai</span>
          </div>
        </div>
      </div>
    </header>
  );
}
