-- Realtime broadcast topics were named `lobby:{code}` and lobby codes are four
-- digits, so any lobby could be subscribed to by enumerating ten thousand
-- names. The topic now carries this secret and is handed out only to callers
-- who pass the lobby's own membership check (#845).
--
-- gen_random_uuid() is core in PostgreSQL 13+ and draws from a strong RNG, so
-- the backfill is as unguessable as the values generated from here on.
ALTER TABLE "Lobbies" ADD COLUMN "realtimeSecret" TEXT;

UPDATE "Lobbies"
SET "realtimeSecret" = replace(gen_random_uuid()::text, '-', '')
WHERE "realtimeSecret" IS NULL;

ALTER TABLE "Lobbies"
  ALTER COLUMN "realtimeSecret" SET NOT NULL,
  ALTER COLUMN "realtimeSecret" SET DEFAULT replace(gen_random_uuid()::text, '-', '');
