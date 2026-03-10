-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "bggId" TEXT;

-- Copy existing BGG IDs to new field
UPDATE "Game" SET "bggId" = "id" WHERE "bggId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_bggId_key" ON "Game"("bggId");
