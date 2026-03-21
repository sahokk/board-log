"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRecommendations, type RecommendedGame } from "@/lib/recommendations"

export async function refreshRecommendations(): Promise<RecommendedGame[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const [recommendations, wishlistItems] = await Promise.all([
    getRecommendations(session.user.id),
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { gameId: true },
    }),
  ])

  const wishlistedIds = new Set(wishlistItems.map((w) => w.gameId))
  return recommendations.map((g) => ({ ...g, wishlisted: wishlistedIds.has(g.id) }))
}
