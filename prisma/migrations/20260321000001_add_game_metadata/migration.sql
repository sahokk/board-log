-- AlterTable: Game にBGGメタデータフィールドを追加
ALTER TABLE "Game" ADD COLUMN "categories"  TEXT;
ALTER TABLE "Game" ADD COLUMN "mechanics"   TEXT;
ALTER TABLE "Game" ADD COLUMN "weight"      DOUBLE PRECISION;
ALTER TABLE "Game" ADD COLUMN "playingTime" INTEGER;
ALTER TABLE "Game" ADD COLUMN "minPlayers"  INTEGER;
ALTER TABLE "Game" ADD COLUMN "maxPlayers"  INTEGER;
