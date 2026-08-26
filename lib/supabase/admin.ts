import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.generated";

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only.
 *
 * Use exclusively for platform-level jobs that must see across tenants
 * (currently: the weekly digest cron). Never import from client components;
 * the key is read from a non-public env var and never sent to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No cookie session for admin clients
      },
    },
  });
}
