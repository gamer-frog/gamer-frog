"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db-types";

/**
 * Hook de Supabase Realtime.
 *
 * Se suscribe a cambios (INSERT/UPDATE/DELETE) en las tablas dadas
 * y dispara `onChange` cuando cualquiera de ellas cambia.
 *
 * Si Supabase no está configurado (modo demo), es un no-op.
 *
 * Uso:
 *   useRealtime(["task_events", "agent_presence"], () => {
 *     refresh();
 *   });
 */

export function useRealtime(
  tables: string[],
  onChange: () => void
) {
  const cbRef = useRef(onChange);
  useEffect(() => {
    cbRef.current = onChange;
  }, [onChange]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tablesKey = tables.join(",");

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return; // demo mode, no-op
    const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

    const channels = tables.map((table) =>
      supabase
        .channel(`realtime-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => cbRef.current()
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[realtime] ${status} on ${table}`);
          }
        })
    );

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [supabaseUrl, supabaseKey, tablesKey]);
}
