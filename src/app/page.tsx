import Image from "next/image"
import Link from "next/link"
import { GameSearchSection } from "@/components/GameSearchSection"
import { WishlistButton } from "@/components/WishlistButton"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRecommendations } from "@/lib/recommendations"

export default async function Home() {
  const session = await auth()

  const [recommendations, wishlistItems, me] = session?.user?.id
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
      ])
    : [[], [], null]

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
            🎲 BoardLog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-amber-900/80">
            ボードゲームの思い出を記録して、アルバムのように振り返ろう
          </p>
          {!session && (
            <div className="mt-8">
              <Link
                href="/api/auth/signin"
                className="inline-block rounded-xl bg-amber-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
              >
                はじめる
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
            <p className="mt-1 text-sm text-amber-800/70">プレイしたゲームを記録しよう</p>
          </div>
          <GameSearchSection />
        </section>

        {/* おすすめゲーム */}
        {recommendedGames.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-amber-950">あなたへのおすすめ</h2>
              <p className="mt-1 text-sm text-amber-800/70">よく遊ぶジャンルをもとにピックアップ</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {recommendedGames.map((game) => (
                <Link
                  key={game.id}
                  href={me?.username ? `/u/${me.username}/games/${game.id}` : `/record?gameId=${game.id}`}
                  className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.nameJa ?? game.name}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-amber-300">
                        <span className="text-4xl">🎲</span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <WishlistButton gameId={game.id} initialWishlisted={game.wishlisted} size="icon" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="mb-1 line-clamp-2 text-xs font-semibold text-amber-950">
                      {game.nameJa ?? game.name}
                    </p>
                    {game.reason && (
                      <p className="line-clamp-1 text-xs text-amber-600/80">
                        {game.reason}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
