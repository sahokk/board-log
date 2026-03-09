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
  game: Game | null
}

export function RecordClient({ game }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [playedAt, setPlayedAt] = useState(today)
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [memo, setMemo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ゲーム未選択の場合
  if (!game) {
    return (
      <div className="wood-card rounded-2xl p-8 text-center shadow-sm">
        <p className="mb-4 text-amber-900">
          記録するゲームを選んでください
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
        >
          ゲームを検索する
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError("評価を選択してください")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/plays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          playedAt,
          rating,
          memo: memo.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました")

      router.push("/plays")
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 選択中のゲーム */}
      <div className="wood-card flex items-center gap-4 rounded-2xl p-4 shadow-sm">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-amber-50/30 to-amber-100/30">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-contain p-1"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-amber-400">
              <span className="text-2xl">🎲</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-950">{game.name}</p>
          <Link
            href="/"
            className="text-xs text-amber-800/70 underline hover:text-amber-950"
          >
            ゲームを変える
          </Link>
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

      {/* 送信 */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-amber-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:opacity-50"
      >
        {submitting ? "保存中..." : "記録を保存する"}
      </button>
    </form>
  )
}
