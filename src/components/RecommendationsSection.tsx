"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons"
import { WishlistButton } from "@/components/WishlistButton"
import { refreshRecommendations } from "@/app/actions"
import type { RecommendedGame } from "@/lib/recommendations"
import { getGameName } from "@/lib/game-utils"

const STORAGE_KEY = "recommendations_cache"

interface Props {
  initialGames: RecommendedGame[]
  username: string | null
}

export function RecommendationsSection({ initialGames, username }: Readonly<Props>) {
  const [games, setGames] = useState<RecommendedGame[]>(() => {
    if (globalThis.window === undefined) return initialGames
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY)
      if (cached) return JSON.parse(cached) as RecommendedGame[]
    } catch {
      // ignore
    }
    return initialGames
  })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(games))
    } catch {
      // ignore
    }
  }, [games])

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
          <FontAwesomeIcon icon={faArrowsRotate} className={isPending ? "animate-spin" : ""} />
          {isPending ? "読み込み中…" : "他をみる"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <Link
              href={username ? `/u/${username}/games/${game.id}` : `/games/${game.id}`}
              className="flex flex-1 flex-col"
            >
              <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                {game.imageUrl ? (
                  <Image
                    src={game.imageUrl}
                    alt={getGameName(game)}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-amber-300">
                    <span className="text-4xl">🎲</span>
                  </div>
                )}
              </div>
              <div className="px-3 pb-1 pt-2">
                <p className="mb-1 line-clamp-2 text-xs font-semibold text-amber-950">
                  {getGameName(game)}
                </p>
                {game.reason && (
                  <p className="text-xs text-amber-600/80">{game.reason}</p>
                )}
              </div>
            </Link>

            {/* アクションボタン */}
            <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
              <Link
                href={`/record?gameId=${game.id}`}
                className="block w-full rounded-lg bg-amber-900 px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
              >
                遊んだ！
              </Link>
              <WishlistButton gameId={game.id} initialWishlisted={game.wishlisted} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
