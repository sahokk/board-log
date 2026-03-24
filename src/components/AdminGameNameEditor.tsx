"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"
import Link from "next/link"

interface Props {
  gameId: string
  currentCustomName: string | null
  pendingReportCount: number
}

export default function AdminGameNameEditor({ gameId, currentCustomName, pendingReportCount }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentCustomName ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, customNameJa: value }),
      })
      if (!res.ok) throw new Error("Failed")
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-amber-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") setEditing(false)
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors"
          title="日本語名を編集（Admin）"
        >
          <FontAwesomeIcon icon={faPen} className="text-[10px]" />
          名称編集
        </button>
      )}

      {pendingReportCount > 0 && (
        <Link
          href="/admin/reports"
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          title="未対応の報告があります"
        >
          <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold">
            {pendingReportCount}
          </span>
          件の報告
        </Link>
      )}
    </div>
  )
}
