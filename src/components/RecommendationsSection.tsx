"use client"

import { useState, useTransition, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons"
import { refreshRecommendations } from "@/app/actions"
import type { RecommendedGame } from "@/lib/recommendations"
import { getGameName } from "@/lib/game-utils"
import { SectionHeader } from "@/components/SectionHeader"
import { GameCard } from "@/components/GameCard"

const STORAGE_KEY = "recommendations_cache"

interface Props {
  initialGames: RecommendedGame[]
}

export function RecommendationsSection({ initialGames }: Readonly<Props>) {
  const [games, setGames] = useState<RecommendedGame[]>(initialGames)
  const [isPending, startTransition] = useTransition()

  // マウント後にキャッシュを適用（サーバーと初回レンダーを一致させるため useEffect で行う）
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as RecommendedGame[]
        if (parsed.length > 0) setGames(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

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
      <SectionHeader
        title="あなたへのおすすめ"
        subtitle="よく遊ぶメカニクスをもとにピックアップ"
        action={
          <button
            type="button"
            onClick={handleReload}
            disabled={isPending}
            className="self-start flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 sm:self-auto"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={isPending ? "animate-spin" : ""} />
            {isPending ? "読み込み中…" : "他をみる"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            gameId={game.id}
            detailHref={`/games/${game.id}`}
            name={getGameName(game)}
            imageUrl={game.imageUrl}
            subtext={game.reason}
            wishlisted={game.wishlisted}
          />
        ))}
      </div>
    </section>
  )
}
