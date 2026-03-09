import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/profile")
  }

  // ユーザーのプレイ記録を取得
  const plays = await prisma.playRecord.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { playedAt: "desc" },
  })

  // 統計情報を計算
  const totalPlays = plays.length
  const uniqueGames = new Set(plays.map((p) => p.gameId)).size
  const averageRating =
    totalPlays > 0
      ? (plays.reduce((sum, p) => sum + p.rating, 0) / totalPlays).toFixed(1)
      : "0"

  // 評価別の数
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: plays.filter((p) => p.rating === rating).length,
  }))

  // お気に入りゲーム（評価5のゲーム）
  const favoriteGames = plays
    .filter((p) => p.rating === 5)
    .slice(0, 5)
    .map((p) => p.game)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-6">
        {/* プロフィールヘッダー */}
        <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-6">
            {/* アバター */}
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-linear-to-br from-gray-100 to-gray-200 shadow-lg">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-gray-400">
                  👤
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {session.user.name ?? "ゲストユーザー"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
            統計
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-4xl font-bold text-gray-900">{totalPlays}</p>
              <p className="mt-2 text-sm font-medium text-gray-500">総プレイ数</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-4xl font-bold text-gray-900">{uniqueGames}</p>
              <p className="mt-2 text-sm font-medium text-gray-500">ユニークゲーム</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-4xl font-bold text-gray-900">{averageRating}</p>
              <p className="mt-2 text-sm font-medium text-gray-500">平均評価</p>
            </div>
          </div>
        </div>

        {/* 評価分布 */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
            評価分布
          </h2>
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {ratingCounts.map(({ rating, count }) => {
              const percentage = totalPlays > 0 ? (count / totalPlays) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex w-24 shrink-0 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= rating ? "text-amber-400" : "text-gray-200"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 overflow-hidden rounded-lg bg-gray-100">
                      <div
                        className="h-full bg-linear-to-r from-amber-400 to-amber-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right text-sm font-medium text-gray-600">
                    {count}回
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* お気に入りゲーム */}
        {favoriteGames.length > 0 && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                お気に入りゲーム
              </h2>
              <p className="text-sm text-gray-500">評価5のゲーム</p>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {favoriteGames.map((game) => (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-square bg-linear-to-br from-gray-50 to-gray-100">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.name}
                        fill
                        className="object-contain p-3"
                        sizes="200px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <span className="text-4xl">🎲</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold text-gray-900">
                      {game.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* プレイ履歴へのリンク */}
        {totalPlays === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">🎲</div>
            <p className="mb-2 text-lg font-medium text-gray-700">
              まだプレイ記録がありません
            </p>
            <p className="mb-6 text-sm text-gray-500">
              ゲームをプレイしたら記録してみましょう
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
            >
              ゲームを探す
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
