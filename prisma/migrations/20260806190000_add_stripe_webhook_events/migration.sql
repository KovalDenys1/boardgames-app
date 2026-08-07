-- Idempotency ledger for Stripe webhooks (#717).
-- Stripe retries any non-2xx delivery and may send the same event more than
-- once; the primary key on Stripe's own event.id makes a replay a no-op.
CREATE TABLE IF NOT EXISTS "StripeWebhookEvents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvents_pkey" PRIMARY KEY ("id")
);

-- Supports pruning old rows; the table is otherwise only read by primary key.
CREATE INDEX IF NOT EXISTS "StripeWebhookEvents_processedAt_idx" ON "StripeWebhookEvents"("processedAt");
