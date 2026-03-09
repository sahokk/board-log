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

interface InitialData {
  playedAt: string
  rating: number
  memo: string
}

interface Props {
  playId: string
  game: Game
  initialData: InitialData
}

export function EditClient({ playId, game, initialData }: Props) {
  const router = useRouter()

  const [playedAt, setPlayedAt] = useState(initialData.playedAt)
  const [rating, setRating] = useState<number>(initialData.rating)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [memo, setMemo] = useState(initialData.memo)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError("評価を選択してください")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/plays/${playId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playedAt,
          rating,
          memo: memo.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました")

      router.push(`/plays/${playId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 選択中のゲーム */}
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
        <div className="flex-1">
          <p className="font-semibold text-amber-950">{game.name}</p>
        </div>
      </div>

      {/* プレイ日 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          プレイ日 <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          required
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* 評価（星） */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          評価 <span className="text-red-600">*</span>
        </label>
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
                  star <= (hoverRating || rating)
                    ? "text-amber-500"
                    : "text-amber-200/40"
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

      {/* メモ */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          メモ（任意）
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="感想・メンバー・スコアなど..."
          rows={5}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm placeholder:text-amber-700/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-3">
        <Link
          href={`/plays/${playId}`}
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
