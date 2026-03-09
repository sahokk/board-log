import { config } from "dotenv"

// Next.js と同様に .env.local → .env の順で読み込む
config({ path: ".env.local" })
config()
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// 人気ボードゲーム（BGG ID + 仮画像）
const GAMES = [
  {
    id: "13",
    name: "Catan",
    imageUrl: "https://picsum.photos/seed/catan/400/400",
  },
  {
    id: "30549",
    name: "Pandemic",
    imageUrl: "https://picsum.photos/seed/pandemic/400/400",
  },
  {
    id: "9209",
    name: "Ticket to Ride",
    imageUrl: "https://picsum.photos/seed/ticket/400/400",
  },
  {
    id: "68448",
    name: "7 Wonders",
    imageUrl: "https://picsum.photos/seed/7wonders/400/400",
  },
  {
    id: "148228",
    name: "Splendor",
    imageUrl: "https://picsum.photos/seed/splendor/400/400",
  },
  {
    id: "230802",
    name: "Azul",
    imageUrl: "https://picsum.photos/seed/azul/400/400",
  },
  {
    id: "178900",
    name: "Codenames",
    imageUrl: "https://picsum.photos/seed/codenames/400/400",
  },
  {
    id: "266192",
    name: "Wingspan",
    imageUrl: "https://picsum.photos/seed/wingspan/400/400",
  },
]

const PLAY_RECORDS = [
  { gameIndex: 5, daysAgo: 1, rating: 5, memo: "初めてプレイ！タイル配置が楽しすぎる。また絶対やりたい。" },
  { gameIndex: 7, daysAgo: 3, rating: 4, memo: "鳥カードのイラストが素晴らしい。エンジンビルドが気持ちいい。" },
  { gameIndex: 0, daysAgo: 7, rating: 3, memo: "定番。ロングゲームになってしまった。" },
  { gameIndex: 1, daysAgo: 10, rating: 5, memo: "協力ゲームって良いな。全員で勝てて最高だった！" },
  { gameIndex: 4, daysAgo: 14, rating: 4, memo: "宝石集めるのが楽しい。テンポが良くてサクサク進む。" },
  { gameIndex: 6, daysAgo: 20, rating: 4, memo: "パーティーゲームとして最高。大人数でやると盛り上がる。" },
  { gameIndex: 3, daysAgo: 25, rating: 3, memo: "" },
  { gameIndex: 2, daysAgo: 30, rating: 4, memo: "路線引きが熱い。最後まで逆転あり。" },
]

async function main() {
  // ログイン済みユーザーを取得
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
  if (!user) {
    console.error("❌ ユーザーが見つかりません。先にGoogleログインしてください。")
    process.exit(1)
  }
  console.log(`✅ ユーザー: ${user.name ?? user.email}`)

  // ゲームをupsert
  for (const game of GAMES) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: { name: game.name, imageUrl: game.imageUrl },
      create: { id: game.id, name: game.name, imageUrl: game.imageUrl },
    })
  }
  console.log(`✅ ゲーム ${GAMES.length}件 upsert完了`)

  // 既存のデモ記録を削除してから再作成
  const existingIds = GAMES.map((g) => g.id)
  await prisma.playRecord.deleteMany({
    where: { userId: user.id, gameId: { in: existingIds } },
  })

  // プレイ記録を作成
  for (const record of PLAY_RECORDS) {
    const game = GAMES[record.gameIndex]
    const playedAt = new Date()
    playedAt.setDate(playedAt.getDate() - record.daysAgo)

    await prisma.playRecord.create({
      data: {
        userId: user.id,
        gameId: game.id,
        playedAt,
        rating: record.rating,
        memo: record.memo || null,
      },
    })
  }
  console.log(`✅ プレイ記録 ${PLAY_RECORDS.length}件 作成完了`)
  console.log("🎲 シード完了！ /plays を確認してください。")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => pool.end())
