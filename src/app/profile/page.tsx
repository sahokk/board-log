import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTitles } from "@/lib/titles"
import { ProfileClient } from "./ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/profile")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      customImageUrl: true,
      favoriteGenres: true,
      name: true,
      image: true,
      email: true,
    },
  })

  if (!user) {
    redirect("/api/auth/signin")
  }

  const entries = await prisma.gameEntry.findMany({
    where: { userId: session.user.id },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  })

  const allSessions = entries.flatMap((e) =>
    e.sessions.map((s) => ({ ...s, gameId: e.gameId }))
  )

  // 統計
  const totalPlays = allSessions.length
  const uniqueGames = entries.length
  const averageRating =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
      : "0"

  // 評価分布（ゲーム単位）
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: entries.filter((e) => e.rating === rating).length,
  }))

  // お気に入りゲーム（評価5）
  const favoriteGames = entries
    .filter((e) => e.rating === 5)
    .slice(0, 5)
    .map((e) => e.game)

  const stats = { totalPlays, uniqueGames, averageRating }

  // プレイカレンダー用（セッション日付）
  const playDateMap = new Map<string, number>()
  allSessions.forEach((s) => {
    const date = s.playedAt.toISOString().split("T")[0]
    playDateMap.set(date, (playDateMap.get(date) ?? 0) + 1)
  })
  const playDates = Array.from(playDateMap, ([date, count]) => ({ date, count }))

  // 称号
  const titles = calculateTitles({
    entries: entries.map((e) => ({ gameId: e.gameId, rating: e.rating })),
    sessions: allSessions.map((s) => ({ playedAt: s.playedAt, gameId: s.gameId })),
  })

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <ProfileClient
          user={user}
          stats={stats}
          ratingCounts={ratingCounts}
          favoriteGames={favoriteGames}
          playDates={playDates}
          titles={titles}
        />
      </div>
    </div>
  )
}
