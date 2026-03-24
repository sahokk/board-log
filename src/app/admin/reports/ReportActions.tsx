"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  reportId: string
}

export default function ReportActions({ reportId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function handleAction(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="px-4 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 disabled:opacity-50"
      >
        {loading === "approve" ? "処理中..." : "承認"}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="px-4 py-1.5 bg-red-400 text-white rounded-full text-sm font-medium hover:bg-red-500 disabled:opacity-50"
      >
        {loading === "reject" ? "処理中..." : "却下"}
      </button>
    </div>
  )
}
