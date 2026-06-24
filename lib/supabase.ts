import { createClient } from "@supabase/supabase-js";

// Client-side (browser) client — uses anon key, respects RLS.
export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Server-side client — uses service role key, bypasses RLS. NEVER expose to browser.
export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
