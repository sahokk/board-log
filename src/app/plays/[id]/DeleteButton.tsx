"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function DeleteButton({ playId }: { playId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/plays/${playId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      router.push("/plays")
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">本当に削除しますか？</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "削除中..." : "削除する"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-gray-400 hover:text-red-500"
    >
      この記録を削除
    </button>
  )
}
