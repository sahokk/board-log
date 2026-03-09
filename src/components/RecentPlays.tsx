import { prisma } from "@/lib/prisma"
import { RecentPlaysCarousel } from "./RecentPlaysCarousel"

export async function RecentPlays() {
  // 全ユーザーの最近のプレイ記録を取得
  const plays = await prisma.playRecord.findMany({
    include: {
      game: true,
      user: true,
    },
    orderBy: { playedAt: "desc" },
    take: 20,
  })

  if (plays.length === 0) {
    return null
  }

  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          最近のプレイ
        </h2>
        <p className="mt-1 text-sm text-gray-500">みんなの思い出</p>
      </div>

      <RecentPlaysCarousel plays={plays} />
    </section>
  )
}
