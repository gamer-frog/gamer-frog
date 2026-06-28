import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Modo de operación de la capa de datos.
 * - "live": Supabase configurado, todas las operaciones persisten.
 * - "demo": Sin credenciales, las writes se rechazan con error explícito.
 *
 * El flag es string (no bool) para que se pueda loguear y serializar.
 */
export type DataMode = "live" | "demo";

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? "live" : "demo";
}

/**
 * Lanzar error explícito cuando se intenta escribir en modo demo.
 * El caller debe catchear y mostrar el mensaje al usuario.
 */
export function assertWritable(action: string): void {
  if (getDataMode() !== "live") {
    throw new Error(
      `No se puede ${action} en modo DEMO. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local para habilitar escritura.`
    );
  }
}

/**
 * Mensaje estándar para mostrar en toasts cuando una write se rechaza.
 */
export const DEMO_WRITE_BLOCKED_MESSAGE =
  "Modo DEMO: escritura deshabilitada. Conectá Supabase para persistir cambios.";
