-- Tracks which achievements a user has unlocked (#260). Achievement
-- definitions (name, description, icon, category) live in code
-- (lib/achievements.ts), not in this table.
CREATE TABLE IF NOT EXISTS "UserAchievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "unlockedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievements_userId_achievementKey_key" ON "UserAchievements"("userId", "achievementKey");
CREATE INDEX IF NOT EXISTS "UserAchievements_userId_idx" ON "UserAchievements"("userId");

ALTER TABLE "UserAchievements" ADD CONSTRAINT "UserAchievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
