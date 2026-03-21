import { prisma } from "@/lib/prisma"
import { translateCategory, translateMechanic } from "@/lib/bgg/translations"

export interface RecommendedGame {
  id: string
  name: string
  nameJa: string | null
  imageUrl: string | null
  categories: string | null
  playingTime: number | null
  wishlisted: boolean
  reason: string // おすすめ理由（日本語）
}

export async function getRecommendations(userId: string): Promise<RecommendedGame[]> {
  const [entries, wishlistItems] = await Promise.all([
    prisma.gameEntry.findMany({
      where: { userId },
      select: { gameId: true, game: { select: { categories: true, mechanics: true } } },
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      select: { gameId: true },
    }),
  ])

  const playedGameIds = new Set(entries.map((e) => e.gameId))
  const wishlistedGameIds = new Set(wishlistItems.map((w) => w.gameId))
  const excludedIds = [...playedGameIds, ...wishlistedGameIds]

  const categoryCount = new Map<string, number>()
  const mechanicCount = new Map<string, number>()
  for (const entry of entries) {
    entry.game.categories?.split(",").forEach((c) => {
      const key = c.trim()
      if (key) categoryCount.set(key, (categoryCount.get(key) ?? 0) + 1)
    })
    entry.game.mechanics?.split(",").forEach((m) => {
      const key = m.trim()
      if (key) mechanicCount.set(key, (mechanicCount.get(key) ?? 0) + 1)
    })
  }

  const topCategories = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)

  const topMechanics = [...mechanicCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)

  if (topCategories.length === 0 && topMechanics.length === 0) return []

  const candidates = await prisma.game.findMany({
    where: {
      id: { notIn: excludedIds },
      imageUrl: { not: null },
      OR: [
        ...topCategories.map((c) => ({ categories: { contains: c } })),
        ...topMechanics.map((m) => ({ mechanics: { contains: m } })),
      ],
    },
    take: 20,
  })

  const scored = candidates.map((game) => {
    let score = 0
    topCategories.forEach((c) => { if (game.categories?.includes(c)) score += 2 })
    topMechanics.forEach((m) => { if (game.mechanics?.includes(m)) score += 1 })

    // おすすめ理由：最初に一致したカテゴリ or メカニクス
    let reason = ""
    for (const cat of topCategories) {
      if (game.categories?.includes(cat)) {
        reason = `「${translateCategory(cat)}」をよく遊ぶあなたに`
        break
      }
    }
    if (!reason) {
      for (const mech of topMechanics) {
        if (game.mechanics?.includes(mech)) {
          reason = `「${translateMechanic(mech)}」好きにおすすめ`
          break
        }
      }
    }

    return { game, score, reason }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ game, reason }) => ({
      id: game.id,
      name: game.name,
      nameJa: game.nameJa,
      imageUrl: game.imageUrl,
      categories: game.categories,
      playingTime: game.playingTime,
      wishlisted: false,
      reason,
    }))
}
