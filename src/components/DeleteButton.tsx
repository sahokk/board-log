"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface Props {
  readonly playId: string
  readonly label?: string
  readonly redirectTo?: string
}

export function DeleteButton({ playId, label = "削除", redirectTo = "/plays" }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/plays/${playId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      router.push(redirectTo)
    } catch {
      showToast("削除に失敗しました", "error")
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-amber-900">
          本当に削除しますか？
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="wood-card flex-1 rounded-xl px-6 py-3 text-center text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 hover:shadow-md disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl border border-red-300 bg-red-50 px-6 py-3 text-center text-sm font-medium text-red-700 shadow-sm transition-all hover:bg-red-100 hover:shadow-md disabled:opacity-50"
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
      className="w-full rounded-xl border border-red-200/60 px-6 py-3 text-center text-sm font-medium text-red-600/70 transition-all hover:border-red-300 hover:bg-red-50/50 hover:text-red-700"
    >
      {label}
    </button>
  )
}
