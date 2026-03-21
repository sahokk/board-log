"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { WishlistButton } from "@/components/WishlistButton"
import type { RecommendedGame } from "@/app/api/recommendations/route"

interface RecommendationsSectionProps {
  initialWishlistedIds: string[]
}

export function RecommendationsSection({ initialWishlistedIds }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([])
  const [topTags, setTopTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const wishlistedSet = new Set(initialWishlistedIds)

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(data.recommendations ?? [])
        setTopTags(data.topTags ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-amber-950">あなたへのおすすめ</h2>
        </div>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="wood-card h-64 w-40 animate-pulse rounded-2xl" />
          ))}
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-amber-950">あなたへのおすすめ</h2>
        {topTags.length > 0 && (
          <p className="mt-1 text-sm text-amber-800/70">
            よく遊ぶ{" "}
            <span className="font-medium text-amber-900">
              {topTags.join(" / ")}
            </span>{" "}
            をもとにピックアップ
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {recommendations.map((game) => (
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
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-amber-300">
                  <span className="text-4xl">🎲</span>
                </div>
              )}
            </div>

            {/* ゲーム情報 */}
            <div className="flex flex-1 flex-col p-3">
              <p className="mb-0.5 line-clamp-2 text-xs font-semibold text-amber-950">
                {game.nameJa ?? game.name}
              </p>
              {game.nameJa && (
                <p className="mb-1 line-clamp-1 text-xs text-amber-700/50">{game.name}</p>
              )}
              {game.matchedTags.length > 0 && (
                <p className="mb-2 line-clamp-1 text-xs text-amber-700/60">
                  {game.matchedTags.slice(0, 2).join(" · ")}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-1.5">
                <Link
                  href={`/record?gameId=${game.id}`}
                  className="block w-full rounded-lg bg-amber-900 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
                >
                  記録する
                </Link>
                <WishlistButton
                  gameId={game.id}
                  initialWishlisted={wishlistedSet.has(game.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
