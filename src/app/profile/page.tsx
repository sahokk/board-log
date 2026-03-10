import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileClient } from "./ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/profile")
  }

  // Fetch user with custom fields
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

  // Fetch play records for statistics
  const plays = await prisma.playRecord.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { playedAt: "desc" },
  })

  // Calculate statistics
  const totalPlays = plays.length
  const uniqueGames = new Set(plays.map((p) => p.gameId)).size
  const averageRating =
    totalPlays > 0
      ? (plays.reduce((sum, p) => sum + p.rating, 0) / totalPlays).toFixed(1)
      : "0"

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: plays.filter((p) => p.rating === rating).length,
  }))

  // Favorite games (rating 5)
  const favoriteGames = plays
    .filter((p) => p.rating === 5)
    .slice(0, 5)
    .map((p) => p.game)

  const stats = { totalPlays, uniqueGames, averageRating }

  // Play dates for calendar heatmap
  const playDateMap = new Map<string, number>()
  plays.forEach((p) => {
    const date = p.playedAt.toISOString().split("T")[0]
    playDateMap.set(date, (playDateMap.get(date) ?? 0) + 1)
  })
  const playDates = Array.from(playDateMap, ([date, count]) => ({ date, count }))

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <ProfileClient
          user={user}
          stats={stats}
          ratingCounts={ratingCounts}
          favoriteGames={favoriteGames}
          playDates={playDates}
        />
      </div>
    </div>
  )
}
