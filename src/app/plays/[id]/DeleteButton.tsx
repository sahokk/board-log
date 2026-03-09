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
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-gray-700">
          本当に削除しますか？
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-center text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-100 hover:shadow-md disabled:opacity-50"
          >
            {deleting ? "削除中..." : "削除する"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full rounded-xl border border-red-200 bg-white px-6 py-3 text-center text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md"
    >
      削除
    </button>
  )
}
