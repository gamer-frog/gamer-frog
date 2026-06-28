"use client";

import { useCallback } from "react";
import { TopNav } from "@/components/shared/top-nav";
import { MissionControlView } from "@/components/mission/mission-control-view";

export default function MissionPage() {
  const setView = useCallback((v: string) => {
    if (typeof window !== "undefined") window.location.href = `/${v === "office" ? "office" : ""}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav view="mission" onViewChange={setView} />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4">
        <MissionControlView />
      </main>
      <footer className="mt-auto border-t border-white/5 py-3 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto text-[10px] font-mono text-muted-foreground">
          BOTARDO OS · Mission Control · v1.0
        </div>
      </footer>
    </div>
  );
}
