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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-amber-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </div>
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* ヘッダー部分 */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">プレイ履歴</h1>
            <p className="mt-1 text-sm text-gray-500">あなたのボードゲームの思い出</p>
          </div>
          <Link
            href="/search"
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
          >
            + 記録する
          </Link>
        </div>

        {plays.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto max-w-sm">
              <div className="mb-4 text-5xl">🎲</div>
              <p className="mb-2 text-lg font-medium text-gray-700">まだプレイ記録がありません</p>
              <p className="mb-8 text-sm text-gray-500">
                ゲームを検索してプレイを記録してみましょう
              </p>
              <Link
                href="/search"
                className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
              >
                ゲームを探す
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {plays.map((play) => (
              <Link
                key={play.id}
                href={`/plays/${play.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                {/* 箱画像 */}
                <div className="relative aspect-square bg-linear-to-br from-gray-50 to-gray-100">
                  {play.game.imageUrl ? (
                    <Image
                      src={play.game.imageUrl}
                      alt={play.game.name}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <span className="text-4xl">🎲</span>
                    </div>
                  )}
                </div>

                {/* 情報 */}
                <div className="p-4">
                  <p className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                    {play.game.name}
                  </p>
                  <StarDisplay rating={play.rating} />
                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {formatDate(play.playedAt)}
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
