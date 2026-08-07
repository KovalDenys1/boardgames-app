-- Clear leftover plain-text lobby passwords (#721).
--
-- verifyLobbyPassword used to fall back to a plain-text string comparison when
-- the stored value wasn't a bcrypt hash, which kept legacy rows working and so
-- meant they were never migrated. That fallback is now removed, and these rows
-- would only ever fail to match.
--
-- Verified before writing this: 64 rows still held a non-bcrypt password and
-- every one of them belongs to an inactive lobby, so nothing joinable changes.
-- Guarded by "isActive" = false regardless, so an active lobby is never silently
-- turned into an open one.
UPDATE "Lobbies"
SET "password" = NULL
WHERE "password" IS NOT NULL
  AND "password" !~ '^\$2[aby]\$[0-9]{2}\$'
  AND "isActive" = false;
