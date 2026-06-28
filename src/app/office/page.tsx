"use client";

import { useCallback } from "react";
import { TopNav } from "@/components/shared/top-nav";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Vista /office (tab "Star Office").
 *
 * Sirve el frontend REAL del repo ringhyacinth/Star-Office-UI (clonado
 * tal cual en /public/star-office/ con un patch mínimo de URLs) dentro
 * de un iframe. El frontend original hace fetch a /api/star-office/*
 * que devuelven el shape exacto que él espera.
 *
 * No tocamos la lógica del juego ni los assets. Solo embebemos.
 */
export default function OfficePage() {
  const setView = useCallback((v: string) => {
    if (typeof window !== "undefined") {
      window.location.hash = v;
      window.location.href = v === "mission" ? "/#mission" : "/";
    }
  }, []);

  const openFullscreen = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open("/star-office/index.html", "_blank", "noopener");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav view="office" onViewChange={setView} />

      {/* Sub-toolbar con acciones de la oficina */}
      <div className="border-b border-white/5 bg-background/60 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-pixel uppercase tracking-wider text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            STAR OFFICE · REAL REPO INTEGRADO
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1.5"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-3 h-3" />
              Volver
            </Button>
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

      {/* Iframe con el office real */}
      <main className="flex-1 relative">
        <iframe
          src="/star-office/index.html"
          title="Star Office — pixel art AI office"
          className="absolute inset-0 w-full h-full border-0"
          style={{
            background: "#1a1a2e",
            // El frontend original está optimizado para 1280px de ancho;
            // le damos todo el viewport y dejamos que su CSS lo escale.
            minHeight: "100%",
          }}
          allow="clipboard-read; clipboard-write"
        />
      </main>
    </div>
  );
}
