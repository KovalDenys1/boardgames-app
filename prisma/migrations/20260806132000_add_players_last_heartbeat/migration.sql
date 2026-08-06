-- Zero-signal disconnect detection (#675): client-side heartbeat timestamp per player.
ALTER TABLE "Players" ADD COLUMN "lastHeartbeatAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now();
