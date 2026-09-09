-- ============================================================================
-- Migration: Enable RLS on LobbyParticipations
-- Date: 2026-09-07
-- Description:
--   LobbyParticipations was added on 2026-09-03 (20260903222410) without RLS,
--   so it was the one table in `public` fully exposed to the `anon` and
--   `authenticated` roles: anyone holding the anon key — which ships in the
--   client bundle — could read or modify all 53 rows. Supabase's own advisor
--   flags it as critical.
--
--   The table is written only by the server, through Prisma, from four API
--   routes via lib/lobby-participation.ts, and nothing reads it in application
--   code. `supabase-js` is used here for realtime and auth and never queries a
--   table directly. So it takes the same shape every other server-only table in
--   this schema has (Notifications, OperationalEvents, PasswordResetTokens,
--   _prisma_migrations …): RLS on, one policy, service_role only.
-- ============================================================================

DO $$
DECLARE
  has_service_role BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role');
  service_clause TEXT;
BEGIN
  service_clause := CASE WHEN has_service_role THEN 'TO service_role' ELSE '' END;

  EXECUTE 'ALTER TABLE public."LobbyParticipations" ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Service role can manage lobby participations" ON public."LobbyParticipations"';

  EXECUTE format(
    'CREATE POLICY "Service role can manage lobby participations"
       ON public."LobbyParticipations" FOR ALL
       %s
       USING ((SELECT public.is_service_role()))
       WITH CHECK ((SELECT public.is_service_role()))',
    service_clause
  );
END
$$;
