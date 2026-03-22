"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { GiDiceSixFacesFive } from "react-icons/gi"
import { WishlistButton } from "@/components/WishlistButton"
import { refreshRecommendations } from "@/app/actions"
import type { RecommendedGame } from "@/lib/recommendations"

interface Props {
  initialGames: RecommendedGame[]
  username: string | null
}

export function RecommendationsSection({ initialGames, username }: Readonly<Props>) {
  const [games, setGames] = useState(initialGames)
  const [isPending, startTransition] = useTransition()

  const handleReload = () => {
    startTransition(async () => {
      const next = await refreshRecommendations()
      if (next.length > 0) setGames(next)
    })
  }

  if (games.length === 0) return null

  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-amber-950">あなたへのおすすめ</h2>
          <p className="mt-1 text-sm text-amber-800/70">よく遊ぶメカニクスをもとにピックアップ</p>
        </div>
        <button
          type="button"
          onClick={handleReload}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
        >
          <span className={isPending ? "animate-spin" : ""}>↺</span>
          {isPending ? "読み込み中…" : "他をみる"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={username ? `/u/${username}/games/${game.id}` : `/record?gameId=${game.id}`}
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
                  <GiDiceSixFacesFive size={40} />
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
                <p className="line-clamp-1 text-xs text-amber-600/80">{game.reason}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
