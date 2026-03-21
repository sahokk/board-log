import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { WishlistButton } from "@/components/WishlistButton"

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  const entries = await prisma.wishlistEntry.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen wood-texture">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">気になるリスト</h1>
          <p className="mt-1 text-sm text-amber-800/70">
            気になっているゲームを記録しよう
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="wood-card rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-4">🎲</p>
            <p className="text-amber-800/70 mb-6">気になるゲームがまだありません</p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
            >
              ゲームを探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {entries.map(({ game }) => (
              <div
                key={game.id}
                className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                {/* 箱画像 */}
                <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={game.nameJa ?? game.name}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-amber-300">
                      <span className="text-4xl">🎲</span>
                    </div>
                  )}
                </div>

                {/* ゲーム情報 */}
                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-0.5 line-clamp-2 text-sm font-semibold text-amber-950">
                    {game.nameJa ?? game.name}
                  </p>
                  {game.nameJa && (
                    <p className="mb-1 line-clamp-1 text-xs text-amber-700/50">{game.name}</p>
                  )}
                  <div className="mt-auto flex flex-col gap-2">
                    <Link
                      href={`/record?gameId=${game.id}`}
                      className="block w-full rounded-lg bg-amber-900 px-4 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
                    >
                      記録する
                    </Link>
                    <WishlistButton
                      gameId={game.id}
                      initialWishlisted={true}
                    />
                    {game.bggId && (
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-lg border border-amber-300 px-4 py-2 text-center text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
                      >
                        BGGで見る
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
