-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('RUNNING', 'PROFIT', 'LOSS');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "status" "TradeStatus" NOT NULL DEFAULT 'RUNNING';
