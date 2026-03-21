"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  playedAt: string | null
  memo: string | null
  imageUrl: string | null
}

interface Props {
  readonly sessions: Session[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "日付未設定"
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr))
}

export function SessionList({ sessions }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const handleDelete = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      const data = await res.json()
      if (data.entryDeleted) {
        router.push("/plays")
      } else {
        router.refresh()
      }
    } catch {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="wood-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-950">
                {formatDate(session.playedAt)}
              </p>
              {session.memo && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-900/80">
                  {session.memo}
                </p>
              )}
            </div>

            {/* 削除ボタン */}
            {confirmingId === session.id ? (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setConfirmingId(null)}
                  disabled={deletingId === session.id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100/40 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(session.id)}
                  disabled={deletingId === session.id}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === session.id ? "削除中..." : "削除"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingId(session.id)}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-amber-700/50 transition-colors hover:bg-red-50/50 hover:text-red-600"
              >
                削除
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
