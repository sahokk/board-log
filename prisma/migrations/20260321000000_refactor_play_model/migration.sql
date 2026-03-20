-- CreateTable: ゲームへの評価（1ゲームにつき1つ）
CREATE TABLE "GameEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: プレイ日ごとの記録
CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL,
    "gameEntryId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameEntry_userId_gameId_key" ON "GameEntry"("userId", "gameId");

-- CreateIndex
CREATE INDEX "GameEntry_userId_idx" ON "GameEntry"("userId");

-- CreateIndex
CREATE INDEX "PlaySession_gameEntryId_idx" ON "PlaySession"("gameEntryId");

-- CreateIndex
CREATE INDEX "PlaySession_playedAt_idx" ON "PlaySession"("playedAt");

-- AddForeignKey
ALTER TABLE "GameEntry" ADD CONSTRAINT "GameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEntry" ADD CONSTRAINT "GameEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaySession" ADD CONSTRAINT "PlaySession_gameEntryId_fkey" FOREIGN KEY ("gameEntryId") REFERENCES "GameEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: PlayRecord → GameEntry + PlaySession
-- 各 (userId, gameId) の最新のratingをGameEntryに格納
INSERT INTO "GameEntry" ("id", "userId", "gameId", "rating", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    pr."userId",
    pr."gameId",
    (
        SELECT pr2."rating"
        FROM "PlayRecord" pr2
        WHERE pr2."userId" = pr."userId" AND pr2."gameId" = pr."gameId"
        ORDER BY pr2."playedAt" DESC
        LIMIT 1
    ),
    MIN(pr."createdAt"),
    NOW()
FROM "PlayRecord" pr
GROUP BY pr."userId", pr."gameId";

-- 各PlayRecordをPlaySessionとして移行
INSERT INTO "PlaySession" ("id", "gameEntryId", "playedAt", "memo", "createdAt", "updatedAt")
SELECT
    pr."id",
    ge."id",
    pr."playedAt",
    pr."memo",
    pr."createdAt",
    pr."updatedAt"
FROM "PlayRecord" pr
JOIN "GameEntry" ge ON ge."userId" = pr."userId" AND ge."gameId" = pr."gameId";

-- DropTable
DROP TABLE "PlayRecord";
