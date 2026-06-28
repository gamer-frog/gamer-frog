"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollOptions {
  /** Intervalo en ms. Default 10s. */
  intervalMs?: number;
  /** Pausar el polling. */
  paused?: boolean;
  /** Cargar inmediatamente al montar. Default true. */
  immediate?: boolean;
}

/**
 * Hook de polling para endpoints GET.
 * Devuelve { data, loading, error, refresh }.
 */
export function usePoll<T>(
  fetcher: () => Promise<T>,
  { intervalMs = 10000, paused = false, immediate = true }: UsePollOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (!mountedRef.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) refresh();
    if (paused) return;
    const id = setInterval(refresh, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [intervalMs, paused, immediate, refresh]);

  return { data, loading, error, refresh, setData };
}
