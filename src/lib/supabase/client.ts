import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Devuelve true si Supabase está configurado con credenciales reales.
 * Cuando es false, la UI/APIs deben caer al mock data.
 */
export const isSupabaseConfigured = (): boolean => {
  if (typeof window === "undefined") {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Browser Supabase client. Si no hay credenciales, devuelve null
 * y los callers deben caer a mock data.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}
