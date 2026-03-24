"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons"
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons"

interface Game {
  id: string
  name: string
  imageUrl: string | null
}

interface Props {
  readonly game: Game | null
  readonly existingEntryId: string | null
  readonly existingRating: number | null
}

export function RecordClient({ game, existingEntryId, existingRating }: Props) {
  const router = useRouter()
  const [playedAt, setPlayedAt] = useState("")
  const [rating, setRating] = useState<number>(existingRating ?? 0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [memo, setMemo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!game) {
    return (
      <div className="wood-card rounded-2xl p-8 text-center shadow-sm">
        <p className="mb-4 text-amber-900">遊んだゲームを選んでください</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
        >
          ゲームを検索する
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (rating === 0) {
      setError("評価を選択してください")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      let entryId: string

      if (existingEntryId) {
        // 既存エントリーに新しいセッションを追加（評価も更新）
        const [sessionRes] = await Promise.all([
          fetch(`/api/plays/${existingEntryId}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playedAt, memo: memo.trim() || null }),
          }),
          // 評価が変わっていれば更新
          existingRating === rating
            ? Promise.resolve()
            : fetch(`/api/plays/${existingEntryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating }),
              }),
        ])
        const sessionData = await sessionRes.json()
        if (!sessionRes.ok) throw new Error(sessionData.error ?? "保存に失敗しました")
        entryId = existingEntryId
      } else {
        // 新規GameEntry + PlaySession
        const res = await fetch("/api/plays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: game.id,
            rating,
            playedAt,
            memo: memo.trim() || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "保存に失敗しました")
        entryId = data.entry.id
      }

      router.push(`/plays/${entryId}`)
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

      {/* 評価 */}
      <div>
        <p className="mb-2 text-sm font-medium text-amber-900">
          このゲームの評価 <span className="text-red-600">*</span>
        </p>
        {existingRating && (
          <p className="mb-2 flex items-center gap-0.5 text-xs text-amber-700/60">
            現在の評価:&nbsp;
            {[1, 2, 3, 4, 5].map((s) => (
              <FontAwesomeIcon
                key={s}
                icon={s <= existingRating ? faStarSolid : faStarRegular}
                className={s <= existingRating ? "text-amber-500" : "text-amber-200/40"}
              />
            ))}
            &nbsp;（変更可）
          </p>
        )}
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
              <FontAwesomeIcon
                icon={star <= (hoverRating || rating) ? faStarSolid : faStarRegular}
                className={star <= (hoverRating || rating) ? "text-amber-500" : "text-amber-200/40"}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-sm text-amber-800/70">{rating} / 5</p>
        )}
      </div>

      {/* プレイ日 */}
      <div>
        <label htmlFor="playedAt" className="mb-2 block text-sm font-medium text-amber-900">
          プレイ日（任意）
        </label>
        <input
          id="playedAt"
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* メモ */}
      <div>
        <label htmlFor="memo" className="mb-2 block text-sm font-medium text-amber-900">
          メモ（任意）
        </label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="感想・メンバー・スコアなど..."
          rows={5}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm placeholder:text-amber-700/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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
