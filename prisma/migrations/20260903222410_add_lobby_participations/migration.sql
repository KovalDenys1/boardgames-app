-- Append-only participation facts, deliberately with no relation to "Users".
-- Guest rows are hard-deleted after three days of inactivity and Players.userId
-- cascades, which had already destroyed the roster of 49% of all games and left
-- the usable analytics window at four days (#816). Written on join rather than
-- on game start, so the 28% of lobbies that never start still record how many
-- people were waiting in them.
CREATE TABLE "LobbyParticipations" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "lobbyCode" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "participantKey" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyParticipations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LobbyParticipations_lobbyId_participantKey_key" ON "LobbyParticipations"("lobbyId", "participantKey");
CREATE INDEX "LobbyParticipations_lobbyId_idx" ON "LobbyParticipations"("lobbyId");
CREATE INDEX "LobbyParticipations_joinedAt_idx" ON "LobbyParticipations"("joinedAt");
