"use client";

import { useCallback } from "react";
import { TopNav } from "@/components/shared/top-nav";
import { StarOfficeView } from "@/components/office/star-office-view";
import { MissionControlView } from "@/components/mission/mission-control-view";
import { useHashState } from "@/hooks/use-hash-state";

export default function Home() {
  const [view, setView] = useHashState("office");

  const handleViewChange = useCallback(
    (v: string) => {
      setView(v);
      // Scroll to top on view change
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setView]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav view={view} onViewChange={handleViewChange} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4">
        {view === "office" ? <StarOfficeView /> : <MissionControlView />}
      </main>

      <footer className="mt-auto border-t border-white/5 py-3 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>BOTARDO OS · Mission Control · v1.0</span>
          <span className="hidden sm:block">
            Tip: presioná <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10">Esc</kbd> para cerrar drawers
          </span>
        </div>
      </footer>
    </div>
  );
}
