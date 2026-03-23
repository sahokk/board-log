import Link from "next/link"
import { GameSearchSection } from "@/components/GameSearchSection"
import { RecommendationsSection } from "@/components/RecommendationsSection"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRecommendations } from "@/lib/recommendations"

export default async function Home() {
  const session = await auth()

  const [recommendations, wishlistItems, me, entryCount] = session?.user?.id
    ? await Promise.all([
        getRecommendations(session.user.id),
        prisma.wishlistItem.findMany({
          where: { userId: session.user.id },
          select: { gameId: true },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { username: true },
        }),
        prisma.gameEntry.count({ where: { userId: session.user.id } }),
      ])
    : [[], [], null, null]

  const wishlistedIds = new Set(wishlistItems.map((w) => w.gameId))
  const recommendedGames = recommendations.map((g) => ({
    ...g,
    wishlisted: wishlistedIds.has(g.id),
  }))

  return (
    <div className="min-h-screen wood-texture">
      {/* ヒーローセクション */}
      <section className="border-b border-amber-200/50">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-amber-950">
            🎲 Boardory
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-amber-900/80">
            遊んだボードゲームをアルバムのように振り返ろう
          </p>
          {session ? (
            entryCount === 0 && (
              <div className="mt-8">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/80 px-6 py-3 text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100 hover:shadow-md"
                >
                  🎲 遊んだゲームをまとめて登録する →
                </Link>
              </div>
            )
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/api/auth/signin"
                className="inline-block rounded-xl bg-amber-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
              >
                はじめる
              </Link>
              <Link href="/onboarding" className="text-sm text-amber-700 underline underline-offset-2 hover:text-amber-900">
                遊んだゲームをまとめて登録する →
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 space-y-16">
        {/* ゲーム検索 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-amber-950">ゲームを探す</h2>
            <p className="mt-1 text-sm text-amber-800/70">遊んだゲームを登録しよう</p>
          </div>
          <GameSearchSection />
        </section>

        {/* おすすめゲーム */}
        <RecommendationsSection initialGames={recommendedGames} username={me?.username ?? null} />
      </div>
    </div>
  )
}
