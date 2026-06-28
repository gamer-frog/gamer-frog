"use client";

/**
 * PostMessage bridge entre el parent (Mission Control) y el iframe del office.
 * Permite que el parent le pida al office que se "enfoque" en un agente.
 *
 * Uso:
 *   const bridge = useOfficeBridge();
 *   bridge.focusAgent("botardo-prime");
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface OfficeBridge {
  ready: boolean;
  focusAgent: (agentSlug: string) => void;
  ping: () => void;
}

export function useOfficeBridge(): OfficeBridge {
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Buscar el iframe del office en el DOM
  const getIframe = useCallback(() => {
    if (iframeRef.current) return iframeRef.current;
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="/star-office/index.html"]'
    );
    iframeRef.current = iframe;
    return iframe;
  }, []);

  // Escuchar mensajes del office
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.source !== "botardo-os-office") return;
      if (data.type === "ready" || data.type === "pong") {
        setReady(true);
      }
      if (data.type === "focus-agent-ack") {
        // Office recibió el mensaje y refrescó el estado
        // (podríamos emitir un toast aquí si quisiéramos)
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const send = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const iframe = getIframe();
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        source: "botardo-os",
        type,
        ...payload,
      },
      "*" // El office valida ev.source === window.parent, así que el origen es seguro
    );
  }, [getIframe]);

  const focusAgent = useCallback((agentSlug: string) => {
    send("focus-agent", { agentSlug });
  }, [send]);

  const ping = useCallback(() => {
    send("ping");
  }, [send]);

  return { ready, focusAgent, ping };
}
