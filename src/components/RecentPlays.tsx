import { prisma } from "@/lib/prisma"
import { RecentPlaysCarousel } from "./RecentPlaysCarousel"

export async function RecentPlays() {
  // 全ユーザーの最近のプレイセッションを取得
  const sessions = await prisma.playSession.findMany({
    include: {
      gameEntry: {
        include: { game: true },
      },
    },
    orderBy: { playedAt: "desc" },
    take: 20,
  })

  if (sessions.length === 0) {
    return null
  }

  const plays = sessions.map((s) => ({
    id: s.id,
    game: s.gameEntry.game,
  }))

  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-amber-950">
          最近のプレイ
        </h2>
        <p className="mt-1 text-sm text-amber-800/70">みんなの思い出</p>
      </div>

      <RecentPlaysCarousel plays={plays} />
    </section>
  )
}
