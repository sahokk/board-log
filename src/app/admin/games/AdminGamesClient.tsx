"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GameImage } from "@/components/GameImage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEyeSlash, faRotateLeft } from "@fortawesome/free-solid-svg-icons"

interface Game {
  id: string
  name: string
  bggId: string | null
  nameJa: string | null
  customNameJa: string | null
  imageUrl: string | null
  _count: { nameReports: number }
}

const STORAGE_KEY = "admin-games-hidden"

function loadHidden(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"))
  } catch {
    return new Set()
  }
}

function saveHidden(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function RowActions({ game }: { game: Game }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(game.customNameJa ?? "")
  const [saving, setSaving] = useState(false)

  async function patchName(name: string | null) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, customNameJa: name }),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-44"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") patchName(value)
            if (e.key === "Escape") setEditing(false)
          }}
        />
        <button
          onClick={() => patchName(value)}
          disabled={saving}
          className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "..." : "保存"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-amber-600 hover:underline"
      >
        {game.customNameJa ?? "（未設定）"}
      </button>
      <button
        onClick={() => { setValue(game.name); patchName(game.name) }}
        disabled={saving}
        title="英語名をそのままセット"
        className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
      >
        英語名をセット
      </button>
    </div>
  )
}

export default function AdminGamesClient({ games }: { games: Game[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    setHidden(loadHidden())
  }, [])

  function toggleHide(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveHidden(next)
      return next
    })
  }

  const visible = games.filter((g) => showHidden ? hidden.has(g.id) : !hidden.has(g.id))
  const hiddenCount = hidden.size

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-gray-500">
          {showHidden
            ? `非表示 ${hiddenCount}件`
            : `${visible.length}件表示${hiddenCount > 0 ? ` / ${hiddenCount}件非表示` : ""}`}
        </p>
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={showHidden ? faRotateLeft : faEyeSlash} />
            {showHidden ? "通常表示に戻す" : "非表示一覧"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 w-10"></th>
              <th className="pb-2 pr-4">英語名</th>
              <th className="pb-2 pr-4">nameJa（BGG）</th>
              <th className="pb-2 pr-4">customNameJa</th>
              <th className="pb-2 text-center w-8">報告</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((game) => (
              <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50 align-middle">
                <td className="py-2 pr-2">
                  <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                    <GameImage src={game.imageUrl ?? null} alt={game.name} className="object-contain p-0.5" />
                  </div>
                </td>
                <td className="py-2 pr-4 text-gray-700">
                  {game.bggId ? (
                    <a
                      href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-amber-700"
                    >
                      {game.name}
                    </a>
                  ) : (
                    game.name
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-500">{game.nameJa}</td>
                <td className="py-2 pr-4">
                  <RowActions game={game} />
                </td>
                <td className="py-2 text-center">
                  {game._count.nameReports > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                      {game._count.nameReports}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => toggleHide(game.id)}
                    title={hidden.has(game.id) ? "再表示" : "修正不要（非表示）"}
                    className="text-gray-300 hover:text-gray-500"
                  >
                    <FontAwesomeIcon icon={hidden.has(game.id) ? faRotateLeft : faEyeSlash} className="text-xs" />
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  {showHidden ? "非表示のゲームはありません" : "すべてのゲームが非表示になっています"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
