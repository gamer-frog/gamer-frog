"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Sparkles } from "lucide-react";
import type { DailyMemo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MemoBannerProps {
  memo: DailyMemo | null;
  loading?: boolean;
}

/**
 * Banner superior con el memo del día anterior.
 * Colapsable para no comer espacio en la oficina.
 */
export function MemoBanner({ memo, loading }: MemoBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="glass rounded-lg p-3 flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded bg-white/10" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-2 w-48 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="glass rounded-lg p-3 flex items-center gap-3 text-sm text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>No hay memo del día anterior todavía.</span>
      </div>
    );
  }

  const lines = memo.markdown.split("\n").filter(Boolean);
  const preview = lines.slice(0, 1).join(" ");

  return (
    <div className="glass rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-pixel text-[10px] text-primary uppercase tracking-wider">
              Yesterday memo
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {memo.memo_date}
            </span>
          </div>
          <p
            className={cn(
              "text-sm text-foreground/80 truncate",
              expanded && "whitespace-pre-wrap truncate-none"
            )}
          >
            {expanded ? memo.markdown : preview}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />
        )}
      </button>
    </div>
  );
}
