import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTitles } from "@/lib/titles"
import { getBggGameDetails } from "@/lib/bgg/client"
import { translateCategory, translateMechanic } from "@/lib/bgg/translations"
import { ProfileClient } from "./ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/profile")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
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

  // BGGメタデータが未取得のゲームを補完
  const gamesNeedingEnrichment = entries
    .map((e) => e.game)
    .filter((g) => g.bggId && !g.categories && !g.mechanics && g.weight == null)
  if (gamesNeedingEnrichment.length > 0) {
    try {
      const ids = gamesNeedingEnrichment.map((g) => g.bggId!)
      const details = await getBggGameDetails(ids)
      await Promise.all(
        details.map((d) =>
          prisma.game.update({
            where: { bggId: d.id },
            data: {
              nameJa: d.nameJa ?? null,
              categories: d.categories.length > 0 ? d.categories.join(",") : null,
              mechanics: d.mechanics.length > 0 ? d.mechanics.join(",") : null,
              weight: d.weight ?? null,
              playingTime: d.playingTime ?? null,
              minPlayers: d.minPlayers ?? null,
              maxPlayers: d.maxPlayers ?? null,
            },
          })
        )
      )
      // メモリ上のentriesも更新して即座に統計に反映
      details.forEach((d) => {
        const game = entries.find((e) => e.game.bggId === d.id)?.game
        if (!game) return
        game.nameJa = d.nameJa ?? null
        game.categories = d.categories.length > 0 ? d.categories.join(",") : null
        game.mechanics = d.mechanics.length > 0 ? d.mechanics.join(",") : null
        game.weight = d.weight ?? null
        game.playingTime = d.playingTime ?? null
        game.minPlayers = d.minPlayers ?? null
        game.maxPlayers = d.maxPlayers ?? null
      })
    } catch (e) {
      console.warn("BGG enrichment failed:", e)
    }
  }

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
    .map((e) => ({ ...e.game, entryId: e.id }))

  const stats = { totalPlays, uniqueGames, averageRating }

  // プレイカレンダー用（セッション日付）
  const playDateMap = new Map<string, number>()
  allSessions.forEach((s) => {
    const date = s.playedAt.toISOString().split("T")[0]
    playDateMap.set(date, (playDateMap.get(date) ?? 0) + 1)
  })
  const playDates = Array.from(playDateMap, ([date, count]) => ({ date, count }))

  // カテゴリ統計（日本語変換して集計）
  const categoryMap = new Map<string, number>()
  entries.forEach((e) => {
    if (e.game.categories) {
      e.game.categories.split(",").forEach((cat) => {
        const t = translateCategory(cat.trim())
        if (t) categoryMap.set(t, (categoryMap.get(t) ?? 0) + 1)
      })
    }
  })
  const topCategories = Array.from(categoryMap, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // メカニクス統計（英語名も保持してツールチップに使用）
  const mechanicMap = new Map<string, { count: number; nameEn: string }>()
  entries.forEach((e) => {
    if (e.game.mechanics) {
      e.game.mechanics.split(",").forEach((mech) => {
        const en = mech.trim()
        const ja = translateMechanic(en)
        const existing = mechanicMap.get(ja)
        mechanicMap.set(ja, { count: (existing?.count ?? 0) + 1, nameEn: en })
      })
    }
  })
  const topMechanics = Array.from(mechanicMap, ([name, { count, nameEn }]) => ({ name, nameEn, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // プレイ時間による重量分布
  const playTimeBuckets = [
    { label: "軽量級 (〜30分)", max: 30 },
    { label: "中軽量 (30〜60分)", max: 60 },
    { label: "中重量 (60〜120分)", max: 120 },
    { label: "重量級 (120分〜)", max: Infinity },
  ]
  const weightDistribution = playTimeBuckets.map(({ label, max }, i) => {
    const min = i === 0 ? 0 : playTimeBuckets[i - 1].max
    return {
      label,
      count: entries.filter((e) => {
        const t = e.game.playingTime
        return t != null && t > min && t <= max
      }).length,
    }
  })

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
          topCategories={topCategories}
          topMechanics={topMechanics}
          weightDistribution={weightDistribution}
        />
      </div>
    </div>
  )
}
