"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

interface Game {
  id: string
  name: string
  imageUrl: string | null
}

interface Props {
  readonly entryId: string
  readonly game: Game
  readonly initialRating: number
}

export function EditClient({ entryId, game, initialRating }: Props) {
  const router = useRouter()

  const [rating, setRating] = useState<number>(initialRating)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (rating === 0) {
      setError("評価を選択してください")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/plays/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました")

      router.push(`/plays/${entryId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ゲーム表示 */}
      <div className="wood-card flex items-center gap-4 rounded-2xl p-4 shadow-sm">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-amber-50/30 to-amber-100/30">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-amber-300">
              <span className="text-3xl">🎲</span>
            </div>
          )}
        </div>
        <p className="font-semibold text-amber-950">{game.name}</p>
      </div>

      {/* 評価 */}
      <div>
        <p className="mb-2 text-sm font-medium text-amber-900">
          評価 <span className="text-red-600">*</span>
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star}点`}
            >
              <span
                className={
                  star <= (hoverRating || rating) ? "text-amber-500" : "text-amber-200/40"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-sm text-amber-800/70">{rating} / 5</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/plays/${entryId}`}
          className="wood-card flex-1 rounded-xl px-6 py-3 text-center text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:opacity-50"
        >
          {submitting ? "更新中..." : "更新する"}
        </button>
      </div>
    </form>
  )
}
