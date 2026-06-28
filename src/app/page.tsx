"use client";

import { useCallback } from "react";
import { TopNav } from "@/components/shared/top-nav";
import { MissionControlView } from "@/components/mission/mission-control-view";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHashState } from "@/hooks/use-hash-state";

export default function Home() {
  const [view, setView] = useHashState("office");

  const handleViewChange = useCallback(
    (v: string) => {
      setView(v);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setView]
  );

  const openFullscreen = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open("/star-office/index.html", "_blank", "noopener");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav view={view} onViewChange={handleViewChange} />

      {view === "office" ? (
        <>
          {/* Sub-toolbar para el office real */}
          <div className="border-b border-white/5 bg-background/60 backdrop-blur-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-pixel uppercase tracking-wider text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
                STAR OFFICE · ringhyacinth/Star-Office-UI integrado
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  onClick={openFullscreen}
                >
                  <Maximize2 className="w-3 h-3" />
                  Pantalla completa
                </Button>
                <a
                  href="https://github.com/ringhyacinth/Star-Office-UI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Repo original
                </a>
              </div>
            </div>
          </div>

          {/* Iframe con el office real del repo */}
          <main className="flex-1 relative">
            <iframe
              src="/star-office/index.html"
              title="Star Office — pixel art AI office"
              className="absolute inset-0 w-full h-full border-0"
              style={{ background: "#1a1a2e", minHeight: "100%" }}
              allow="clipboard-read; clipboard-write"
            />
          </main>
        </>
      ) : (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4">
          <MissionControlView />
        </main>
      )}

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
