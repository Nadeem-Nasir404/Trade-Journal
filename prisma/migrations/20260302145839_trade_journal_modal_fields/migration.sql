-- AlterEnum
ALTER TYPE "TradeStatus" ADD VALUE 'BREAKEVEN';

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "emotions" TEXT,
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "setup" TEXT,
ADD COLUMN     "strategy" TEXT;
