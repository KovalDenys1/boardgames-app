-- Composite indexes for the browse-lobbies query (GET /api/lobby), which
-- filters on isActive (+ optional gameType) and sorts by createdAt. Only
-- single-column indexes existed before, so Postgres couldn't satisfy
-- filter+sort from one index. Polled every 15s by every open /lobby tab.
CREATE INDEX IF NOT EXISTS "Lobbies_isActive_createdAt_idx" ON "Lobbies"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Lobbies_isActive_gameType_idx" ON "Lobbies"("isActive", "gameType");
