"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface Session {
  id: string
  playedAt: string | null
  memo: string | null
  imageUrl: string | null
}

interface Props {
  readonly sessions: Session[]
  readonly emptyRedirectPath?: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "日付未設定"
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr))
}

function toDateInputValue(isoStr: string | null): string {
  if (!isoStr) return ""
  return isoStr.split("T")[0]
}

export function SessionList({ sessions, emptyRedirectPath = "/plays" }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlayedAt, setEditPlayedAt] = useState("")
  const [editMemo, setEditMemo] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  const startEdit = (session: Session) => {
    setEditingId(session.id)
    setEditPlayedAt(toDateInputValue(session.playedAt))
    setEditMemo(session.memo ?? "")
    setConfirmingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleSave = async (sessionId: string) => {
    setSavingId(sessionId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playedAt: editPlayedAt || null, memo: editMemo.trim() || null }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      setEditingId(null)
      router.refresh()
      showToast("記録を更新しました")
    } catch {
      showToast("保存に失敗しました", "error")
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      const data = await res.json()
      if (data.entryDeleted) {
        router.push(emptyRedirectPath)
      } else {
        router.refresh()
        showToast("記録を削除しました")
      }
    } catch {
      showToast("削除に失敗しました", "error")
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="wood-card rounded-2xl p-4 shadow-sm">
          {editingId === session.id ? (
            <div className="space-y-3">
              <div>
                <label htmlFor={`playedAt-${session.id}`} className="mb-1 block text-xs font-medium text-amber-800/70">
                  プレイ日（任意）
                </label>
                <input
                  id={`playedAt-${session.id}`}
                  type="date"
                  value={editPlayedAt}
                  onChange={(e) => setEditPlayedAt(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/30 px-3 py-2 text-sm text-amber-950 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor={`memo-${session.id}`} className="mb-1 block text-xs font-medium text-amber-800/70">
                  メモ（任意）
                </label>
                <textarea
                  id={`memo-${session.id}`}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/30 px-3 py-2 text-sm text-amber-950 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={savingId === session.id}
                  className="wood-card rounded-lg px-4 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleSave(session.id)}
                  disabled={savingId === session.id}
                  className="rounded-lg bg-amber-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-amber-800 disabled:opacity-50"
                >
                  {savingId === session.id ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : (
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
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(session)}
                    className="rounded-lg px-2 py-1.5 text-xs text-amber-700/60 transition-colors hover:bg-amber-100/40 hover:text-amber-900"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setConfirmingId(session.id)}
                    className="rounded-lg px-2 py-1.5 text-xs text-amber-700/50 transition-colors hover:bg-red-50/50 hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
