"use client";

import { useEffect, useState } from "react";

/**
 * Hook que sincroniza un estado con el hash de la URL.
 * Útil para tabs/deep-links sin necesidad de router.
 */
export function useHashState(defaultValue: string) {
  const [value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h) setValue(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const update = (next: string) => {
    setValue(next);
    if (typeof window !== "undefined") {
      window.location.hash = next;
    }
  };

  return [value, update] as const;
}
