-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "executionQuality" TEXT,
ADD COLUMN     "preTradeMood" TEXT,
ADD COLUMN     "strategyTags" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "journalEntryId" INTEGER;

-- CreateIndex
CREATE INDEX "Trade_journalEntryId_idx" ON "Trade"("journalEntryId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
