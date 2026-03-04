-- Add exchange source metadata for imported trades
ALTER TABLE "Trade"
ADD COLUMN "source" TEXT,
ADD COLUMN "externalId" TEXT;

CREATE INDEX "Trade_userId_source_externalId_idx"
ON "Trade"("userId", "source", "externalId");

