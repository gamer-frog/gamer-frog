"use client";

import { useCallback } from "react";
import { TopNav } from "@/components/shared/top-nav";
import { StarOfficeView } from "@/components/office/star-office-view";

export default function OfficePage() {
  const setView = useCallback((v: string) => {
    if (typeof window !== "undefined") window.location.href = `/${v === "mission" ? "mission" : ""}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav view="office" onViewChange={setView} />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4">
        <StarOfficeView />
      </main>
      <footer className="mt-auto border-t border-white/5 py-3 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto text-[10px] font-mono text-muted-foreground">
          BOTARDO OS · Star Office · v1.0
        </div>
      </footer>
    </div>
  );
}
