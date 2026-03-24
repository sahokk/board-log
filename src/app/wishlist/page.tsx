import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WishlistButton } from "@/components/WishlistButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDiceD6 } from "@fortawesome/free-solid-svg-icons"
import { faHeart } from "@fortawesome/free-regular-svg-icons"

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/wishlist")
  }

  const [items, me] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: { game: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    }),
  ])

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">気になるリスト</h1>
          <p className="mt-1 text-sm text-amber-800/70">
            {items.length > 0 ? `${items.length}タイトル` : "まだ追加されていません"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="wood-card rounded-2xl p-16 text-center shadow-sm">
            <div className="mb-4 text-5xl">🤍</div>
            <p className="mb-2 text-lg font-medium text-amber-900">気になるゲームを追加しよう</p>
            <p className="mb-8 text-sm text-amber-800/70">
              ゲーム検索やおすすめから 🤍 をタップすると追加されます
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
            >
              ゲームを探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map(({ game }) => (
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
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-amber-300">
                      <span className="text-4xl">🎲</span>
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <WishlistButton gameId={game.id} initialWishlisted={true} size="icon" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-semibold text-amber-950">
                    {game.nameJa ?? game.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
