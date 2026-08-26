import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.generated";

/**
 * Browser Supabase client.
 *
 * Falls back to placeholders when NEXT_PUBLIC_* vars are absent so that
 * `next build` can prerender pages on machines without secrets (CI, fresh
 * clones). Auth calls made against placeholders fail fast in the console
 * instead of crashing the whole render tree.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — using placeholders. Auth will not work until you configure .env.local."
    );
  }

  return createBrowserClient<Database>(
    url ?? "http://localhost:54321",
    anonKey ?? "placeholder-anon-key"
  );
}

