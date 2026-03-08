import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-xs text-yellow-400">
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  )
}

export default async function PlaysPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/plays")
  }

  const plays = await prisma.playRecord.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { playedAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">プレイ履歴</h1>
        <Link
          href="/search"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + 記録する
        </Link>
      </div>

      {plays.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-16 text-center">
          <p className="mb-2 text-gray-500">まだプレイ記録がありません</p>
          <p className="mb-6 text-sm text-gray-400">
            ゲームを検索してプレイを記録してみましょう
          </p>
          <Link
            href="/search"
            className="inline-block rounded-md bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-700"
          >
            ゲームを探す
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {plays.map((play) => (
            <Link
              key={play.id}
              href={`/plays/${play.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 箱画像 */}
              <div className="relative aspect-square bg-gray-100">
                {play.game.imageUrl ? (
                  <Image
                    src={play.game.imageUrl}
                    alt={play.game.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <span className="text-3xl">🎲</span>
                  </div>
                )}
              </div>

              {/* 情報 */}
              <div className="p-3">
                <p className="mb-1 line-clamp-1 text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  {play.game.name}
                </p>
                <StarDisplay rating={play.rating} />
                <p className="mt-1 text-xs text-gray-400">
                  {formatDate(play.playedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
