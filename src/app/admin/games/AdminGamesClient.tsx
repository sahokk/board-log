"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
import { GameImage } from "@/components/GameImage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faEyeSlash, faRotateLeft, faChevronDown, faChevronUp,
  faArrowUpWideShort, faUpRightFromSquare, faPencil,
} from "@fortawesome/free-solid-svg-icons"

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

function loadHidden(): Set<string> {
  if (globalThis.window === undefined) return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"))
  } catch {
    return new Set()
  }
}

function saveHidden(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function emptyMessage(showHidden: boolean, filterReports: boolean, filterNoCustom: boolean): string {
  if (showHidden) return "非表示のゲームはありません"
  if (filterReports) return "報告のあるゲームはありません"
  if (filterNoCustom) return "未設定のゲームはありません"
  return "ゲームがありません"
}

/** 実際にユーザーに表示されているソースを返す */
function resolvedSource(game: Game): "カスタム" | "BGG" | "英語" {
  if (game.customNameJa) return "カスタム"
  if (game.nameJa) return "BGG"
  return "英語"
}

function ReportsPanel({ reports, onApply }: Readonly<{ reports: Report[]; onApply: (id: string) => void }>) {
  return (
    <div className="space-y-2 py-2">
      {reports.map((r) => {
        const reporter = r.reporter.displayName ?? r.reporter.name ?? r.reporter.username ?? "Unknown"
        return (
          <div key={r.id} className="flex items-start justify-between gap-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-amber-800">{r.suggestedName}</span>
              {r.reason && <p className="mt-0.5 text-gray-500">{r.reason}</p>}
              <p className="mt-0.5 text-gray-400">
                {reporter} · {new Date(r.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <button
              onClick={() => onApply(r.id)}
              className="shrink-0 rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
            >
              採用
            </button>
          </div>
        )
      })}
    </div>
  )
}

interface GameRowProps {
  game: Game
  isHidden: boolean
  isExpanded: boolean
  onToggleHide: () => void
  onToggleExpand: () => void
  onUpdateName: (customNameJa: string | null) => void
  onApplyReport: (reportId: string) => void
}

function GameRow({ game, isHidden, isExpanded, onToggleHide, onToggleExpand, onUpdateName, onApplyReport }: Readonly<GameRowProps>) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(game.customNameJa ?? "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => { setValue(game.customNameJa ?? "") }, [game.customNameJa])

  async function patchName(nameToSet: string | null) {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, customNameJa: nameToSet }),
      })
      if (!res.ok) { setSaveError(true); return }
      setEditing(false)
      onUpdateName(nameToSet?.trim() || null)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const displayName = game.customNameJa ?? game.nameJa ?? game.name
  const source = resolvedSource(game)
  const sourceBadgeClass = source === "カスタム"
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-500"

  return (
    <Fragment>
      <tr className="border-b border-gray-100 align-middle hover:bg-gray-50/60">

        {/* サムネイル */}
        <td className="py-2 pl-2 pr-3">
          <div className="relative h-9 w-9 overflow-hidden rounded shrink-0">
            <GameImage src={game.imageUrl} alt={game.name} className="object-contain p-0.5" />
          </div>
        </td>

        {/* ゲーム名：英語（BGGリンク）＋ nameJa */}
        <td className="py-2 pr-4">
          <div>
            {game.bggId ? (
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-baseline gap-1 text-sm font-medium text-gray-800 hover:text-amber-700 hover:underline"
              >
                {game.name}
                <FontAwesomeIcon icon={faUpRightFromSquare} className="text-[9px] text-gray-400 shrink-0" />
              </a>
            ) : (
              <span className="text-sm font-medium text-gray-800">{game.name}</span>
            )}
            {game.nameJa && (
              <p className="mt-0.5 text-xs text-gray-400">{game.nameJa}</p>
            )}
          </div>
        </td>

        {/* 表示中の名前 */}
        <td className="py-2 pr-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm text-gray-700">{displayName}</span>
            <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium ${sourceBadgeClass}`}>
              {source}
            </span>
          </div>
        </td>

        {/* customNameJa インライン編集 */}
        <td className="py-2 pr-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") patchName(value)
                  if (e.key === "Escape") { setValue(game.customNameJa ?? ""); setEditing(false) }
                }}
              />
              <button
                onClick={() => patchName(value)}
                disabled={saving}
                className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? "…" : "保存"}
              </button>
              <button
                onClick={() => { setValue(game.customNameJa ?? ""); setEditing(false); setSaveError(false) }}
                className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              {saveError && <span className="shrink-0 text-xs text-red-500">保存失敗</span>}
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-1.5 text-left text-sm transition-colors hover:border-gray-200 hover:bg-white"
            >
              {game.customNameJa ? (
                <span className="text-amber-700">{game.customNameJa}</span>
              ) : (
                <span className="italic text-gray-400">未設定</span>
              )}
              <FontAwesomeIcon
                icon={faPencil}
                className="shrink-0 text-[10px] text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          )}
        </td>

        {/* 報告数 */}
        <td className="py-2 pr-3 text-center">
          {game._count.nameReports > 0 && (
            <button
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 hover:bg-red-200"
            >
              {game._count.nameReports}
              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
            </button>
          )}
        </td>

        {/* 非表示 */}
        <td className="py-2 pr-2 text-center">
          <button
            onClick={onToggleHide}
            title={isHidden ? "再表示" : "修正不要（非表示）"}
            className="text-gray-300 hover:text-gray-500"
          >
            <FontAwesomeIcon icon={isHidden ? faRotateLeft : faEyeSlash} className="text-xs" />
          </button>
        </td>
      </tr>

      {isExpanded && game.nameReports.length > 0 && (
        <tr className="bg-amber-50/30">
          <td colSpan={6} className="px-12 pb-3">
            <ReportsPanel reports={game.nameReports} onApply={onApplyReport} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}

export default function AdminGamesClient({ games }: Readonly<{ games: Game[] }>) {
  const [localGames, setLocalGames] = useState(games)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [filterReports, setFilterReports] = useState(false)
  const [filterNoCustom, setFilterNoCustom] = useState(false)
  const [sortByReports, setSortByReports] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

  function updateGameName(gameId: string, customNameJa: string | null) {
    setLocalGames((prev) => prev.map((g) => g.id === gameId ? { ...g, customNameJa } : g))
  }

  async function applyReport(reportId: string, gameId: string) {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      if (!res.ok) { alert("採用に失敗しました"); return }
      const data = await res.json() as { customNameJa?: string }
      setLocalGames((prev) => prev.map((g) => {
        if (g.id !== gameId) return g
        return { ...g, customNameJa: data.customNameJa ?? g.customNameJa, nameReports: [], _count: { nameReports: 0 } }
      }))
      setExpanded((prev) => { const next = new Set(prev); next.delete(gameId); return next })
    } catch {
      alert("採用に失敗しました")
    }
  }

  const visible = useMemo(() => {
    let list = localGames.filter((g) => showHidden ? hidden.has(g.id) : !hidden.has(g.id))
    if (filterReports) list = list.filter((g) => g._count.nameReports > 0)
    if (filterNoCustom) list = list.filter((g) => !g.customNameJa)
    if (sortByReports) list = [...list].sort((a, b) => b._count.nameReports - a._count.nameReports)
    return list
  }, [localGames, hidden, showHidden, filterReports, filterNoCustom, sortByReports])

  const hiddenCount = hidden.size
  const reportCount = localGames.filter((g) => g._count.nameReports > 0).length
  const noCustomCount = localGames.filter((g) => !g.customNameJa && !hidden.has(g.id)).length

  return (
    <>
      {/* ツールバー */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-sm text-gray-500">
          {showHidden ? `非表示 ${hiddenCount}件` : `${visible.length}件`}
          {reportCount > 0 && !showHidden && (
            <span className="ml-1 text-red-500 text-xs">（報告あり {reportCount}件）</span>
          )}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {noCustomCount > 0 && !showHidden && (
            <button
              onClick={() => setFilterNoCustom((v) => !v)}
              className={`rounded border px-2.5 py-1 text-xs ${filterNoCustom ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
            >
              未設定のみ（{noCustomCount}）
            </button>
          )}
          {reportCount > 0 && !showHidden && (
            <button
              onClick={() => setFilterReports((v) => !v)}
              className={`rounded border px-2.5 py-1 text-xs ${filterReports ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
            >
              報告ありのみ
            </button>
          )}
          <button
            onClick={() => setSortByReports((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs ${sortByReports ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
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

      {/* テーブル：table-fixed で列幅をきっちり配分 */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-12" />
          <col className="w-[28%]" />
          <col className="w-[18%]" />
          <col className="w-[32%]" />
          <col className="w-14" />
          <col className="w-9" />
        </colgroup>
        <thead>
          <tr className="border-b-2 border-gray-200 text-left text-xs font-medium text-gray-400">
            <th className="pb-2 pl-2"></th>
            <th className="pb-2 pr-4">ゲーム名 / nameJa</th>
            <th className="pb-2 pr-4">表示中</th>
            <th className="pb-2 pr-4">customNameJa</th>
            <th className="pb-2 pr-3 text-center">報告</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              isHidden={hidden.has(game.id)}
              isExpanded={expanded.has(game.id)}
              onToggleHide={() => toggleHide(game.id)}
              onToggleExpand={() => toggleExpand(game.id)}
              onUpdateName={(val) => updateGameName(game.id, val)}
              onApplyReport={(reportId) => applyReport(reportId, game.id)}
            />
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                {emptyMessage(showHidden, filterReports, filterNoCustom)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
