import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTitles } from "@/lib/titles"
import { calculateBoardgameType } from "@/lib/boardgame-type"
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
      isProfilePublic: true,
      featuredEntryIds: true,
    },
  })

  if (!user) redirect("/api/auth/signin")

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

  const totalPlays = allSessions.length
  const uniqueGames = entries.length

  const wishlistCount = await prisma.wishlistItem.count({ where: { userId: session.user.id } })

  const titles = calculateTitles({
    entries: entries.map((e) => ({ gameId: e.gameId, rating: e.rating })),
    sessions: allSessions.flatMap((s) => (s.playedAt ? [{ playedAt: s.playedAt, gameId: s.gameId }] : [])),
    games: entries.map((e) => ({ categories: e.game.categories, mechanics: e.game.mechanics })),
    wishlistCount,
  })

  const boardgameType = calculateBoardgameType({
    entries: entries.map((e) => ({ gameId: e.gameId, sessionCount: e.sessions.length })),
    games: entries.map((e) => ({
      gameId: e.gameId,
      weight: e.game.weight,
      categories: e.game.categories,
      mechanics: e.game.mechanics,
    })),
  })

  // All played games for the picker — sorted by rating desc, then session count desc
  const allGames = entries.map((e) => ({
    id: e.game.id,
    entryId: e.id,
    name: e.game.nameJa || e.game.name,
    imageUrl: e.game.imageUrl,
    sessionCount: e.sessions.length,
    rating: e.rating,
  })).sort((a, b) => b.rating - a.rating || b.sessionCount - a.sessionCount)

  // Resolve featured games from saved IDs, fallback to top-3 by session count
  const savedIds: string[] = user.featuredEntryIds ? JSON.parse(user.featuredEntryIds) : []
  let featuredGames: typeof allGames
  if (savedIds.length > 0) {
    featuredGames = savedIds
      .map((id) => allGames.find((g) => g.entryId === id))
      .filter(Boolean) as typeof allGames
  } else {
    featuredGames = allGames.slice(0, 3)
  }

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <ProfileClient
          user={user}
          stats={{ totalPlays, uniqueGames }}
          allGames={allGames}
          featuredGames={featuredGames}
          savedFeaturedIds={savedIds}
          boardgameType={boardgameType}
          titles={titles}
        />
      </div>
    </div>
  )
}
