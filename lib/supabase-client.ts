import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // We never use Supabase auth here (NextAuth + guest JWT own sessions),
        // and supabase-js otherwise persists to localStorage — an extra crash
        // vector in embedded WebViews where storage is null (#769).
        auth: { persistSession: false, autoRefreshToken: false },
      }
    )
  }
  return client
}
