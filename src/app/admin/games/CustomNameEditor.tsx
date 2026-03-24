"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  gameId: string
  currentCustomName: string | null
}

export default function CustomNameEditor({ gameId, currentCustomName }: Props) {
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
      if (!res.ok) throw new Error()
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-amber-600 hover:underline"
      >
        {currentCustomName ?? "（未設定）"}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") setEditing(false)
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
      >
        {saving ? "..." : "保存"}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </div>
  )
}
