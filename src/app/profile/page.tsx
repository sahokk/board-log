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
      username: true,
      displayName: true,
      customImageUrl: true,
      favoriteGenres: true,
      name: true,
      image: true,
      email: true,
      isProfilePublic: true,
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

  const favoriteGames = entries
    .filter((e) => e.rating === 5)
    .slice(0, 5)
    .map((e) => ({ ...e.game, entryId: e.id }))

  const wishlistCount = await prisma.wishlistItem.count({ where: { userId: session.user.id } })

  const titles = calculateTitles({
    entries: entries.map((e) => ({ gameId: e.gameId, rating: e.rating })),
    sessions: allSessions.flatMap((s) => (s.playedAt ? [{ playedAt: s.playedAt, gameId: s.gameId }] : [])),
    games: entries.map((e) => ({ categories: e.game.categories, mechanics: e.game.mechanics })),
    wishlistCount,
  })

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <ProfileClient
          user={user}
          stats={{ totalPlays, uniqueGames }}
          favoriteGames={favoriteGames}
          titles={titles}
        />
      </div>
    </div>
  )
}
