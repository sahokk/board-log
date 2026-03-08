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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="mb-4 text-gray-600">
          記録するゲームを選んでください
        </p>
        <Link
          href="/search"
          className="inline-block rounded-md bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-700"
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
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-white">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-contain p-1"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <span className="text-2xl">🎲</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{game.name}</p>
          <Link
            href="/search"
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            ゲームを変える
          </Link>
        </div>
      </div>

      {/* プレイ日 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          プレイ日 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      {/* 評価（星） */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          評価 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star}点`}
            >
              <span
                className={
                  star <= (hoverRating || rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-xs text-gray-500">{rating} / 5</p>
        )}
      </div>

      {/* メモ */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          メモ（任意）
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="感想・メンバー・スコアなど..."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      {/* エラー */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 送信 */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {submitting ? "保存中..." : "記録を保存する"}
      </button>
    </form>
  )
}
