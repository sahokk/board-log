"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { GameImage } from "@/components/GameImage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEyeSlash, faRotateLeft, faChevronDown, faChevronUp, faArrowUpWideShort } from "@fortawesome/free-solid-svg-icons"

interface Report {
  id: string
  suggestedName: string
  reason: string | null
  createdAt: Date
  reporter: { username: string | null; displayName: string | null; name: string | null }
}

interface Game {
  id: string
  name: string
  bggId: string | null
  nameJa: string | null
  customNameJa: string | null
  imageUrl: string | null
  nameReports: Report[]
  _count: { nameReports: number }
}

const STORAGE_KEY = "admin-games-hidden"

function emptyMessage(showHidden: boolean, filterReports: boolean): string {
  if (showHidden) return "非表示のゲームはありません"
  if (filterReports) return "報告のあるゲームはありません"
  return "すべてのゲームが非表示になっています"
}

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
      <button onClick={() => setEditing(true)} className="text-sm text-amber-600 hover:underline">
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

function ReportsPanel({ reports, onApply }: Readonly<{ reports: Report[]; onApply: (name: string) => void }>) {
  return (
    <div className="space-y-2 pt-1">
      {reports.map((r) => {
        const reporter = r.reporter.displayName ?? r.reporter.name ?? r.reporter.username ?? "Unknown"
        return (
          <div key={r.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-amber-800">{r.suggestedName}</span>
                {r.reason && <p className="text-gray-500 mt-0.5">{r.reason}</p>}
                <p className="text-gray-400 mt-0.5">
                  {reporter} · {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <button
                onClick={() => onApply(r.suggestedName)}
                className="shrink-0 px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600"
              >
                採用
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminGamesClient({ games }: { games: Game[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [filterReports, setFilterReports] = useState(false)
  const [sortByReports, setSortByReports] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => { setHidden(loadHidden()) }, [])

  function toggleHide(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveHidden(next)
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyReport(gameId: string, name: string) {
    await fetch("/api/admin/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, customNameJa: name }),
    })
    router.refresh()
  }

  const visible = useMemo(() => {
    let list = games.filter((g) => showHidden ? hidden.has(g.id) : !hidden.has(g.id))
    if (filterReports) list = list.filter((g) => g._count.nameReports > 0)
    if (sortByReports) list = [...list].sort((a, b) => b._count.nameReports - a._count.nameReports)
    return list
  }, [games, hidden, showHidden, filterReports, sortByReports])

  const hiddenCount = hidden.size
  const reportCount = games.filter((g) => g._count.nameReports > 0).length

  return (
    <>
      {/* ツールバー */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-sm text-gray-500">
          {showHidden ? `非表示 ${hiddenCount}件` : `${visible.length}件`}
          {reportCount > 0 && !showHidden && (
            <span className="ml-1 text-red-500">（報告あり {reportCount}件）</span>
          )}
        </p>
        <div className="flex items-center gap-2 ml-auto">
          {reportCount > 0 && !showHidden && (
            <button
              onClick={() => setFilterReports((v) => !v)}
              className={`text-xs border rounded px-2 py-1 ${filterReports ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
            >
              報告ありのみ
            </button>
          )}
          <button
            onClick={() => setSortByReports((v) => !v)}
            className={`flex items-center gap-1 text-xs border rounded px-2 py-1 ${sortByReports ? "bg-amber-50 border-amber-300 text-amber-700" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
          >
            <FontAwesomeIcon icon={faArrowUpWideShort} />
            報告多い順
          </button>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={showHidden ? faRotateLeft : faEyeSlash} />
              {showHidden ? "通常表示" : `非表示 ${hiddenCount}件`}
            </button>
          )}
        </div>
      </div>

      {/* テーブル */}
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
              <>
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
                      <button
                        onClick={() => toggleExpand(game.id)}
                        className="inline-flex items-center gap-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-bold hover:bg-red-200"
                      >
                        {game._count.nameReports}
                        <FontAwesomeIcon icon={expanded.has(game.id) ? faChevronUp : faChevronDown} className="text-[10px]" />
                      </button>
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
                {expanded.has(game.id) && game.nameReports.length > 0 && (
                  <tr key={`${game.id}-reports`} className="bg-gray-50">
                    <td colSpan={6} className="px-4 pb-3">
                      <ReportsPanel
                        reports={game.nameReports}
                        onApply={(name) => applyReport(game.id, name)}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  {emptyMessage(showHidden, filterReports)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
