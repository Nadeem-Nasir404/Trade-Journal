CREATE TABLE "TradingRiskProfile" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "phase1TargetPct" DOUBLE PRECISION,
    "phase2TargetPct" DOUBLE PRECISION,
    "personalDailyLossPct" DOUBLE PRECISION,
    "customRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingRiskProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TradingRiskProfile_accountId_key" ON "TradingRiskProfile"("accountId");
CREATE INDEX "TradingRiskProfile_userId_idx" ON "TradingRiskProfile"("userId");

ALTER TABLE "TradingRiskProfile" ADD CONSTRAINT "TradingRiskProfile_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
