INSERT INTO "User" ("id", "email", "name", "authProvider", "createdAt", "updatedAt")
VALUES (
  'legacy-system-user',
  'legacy+system@alphajournal.local',
  'Legacy System User',
  'EMAIL',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

UPDATE "JournalEntry"
SET "userId" = 'legacy-system-user'
WHERE "userId" IS NULL;

UPDATE "Trade"
SET "userId" = 'legacy-system-user'
WHERE "userId" IS NULL;

ALTER TABLE "JournalEntry" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Trade" ALTER COLUMN "userId" SET NOT NULL;
