"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  readonly entryId: string
  readonly initialRating: number
}

export function RatingEditor({ entryId, initialRating }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/plays/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setRating(initialRating)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= rating ? "text-amber-500" : "text-amber-200/40"}
            >
              ★
            </span>
          ))}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-amber-800/70 underline hover:text-amber-950"
        >
          変更
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
            <span className={star <= (hoverRating || rating) ? "text-amber-500" : "text-amber-200/40"}>
              ★
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="wood-card rounded-lg px-4 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving || rating === 0}
          className="rounded-lg bg-amber-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-amber-800 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  )
}
