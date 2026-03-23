"use client"

import { useRef, useState, useEffect, useLayoutEffect } from "react"
import Image from "next/image"
import { toPng } from "html-to-image"
import { BusinessCard } from "./BusinessCard"
import { useToast } from "./Toast"
import type { TitleWithUnlocked } from "@/lib/titles"
import type { BoardgameType } from "@/lib/boardgame-type"
import { getTheme, CARD_THEMES } from "@/lib/card-themes"

interface Game {
  id: string
  entryId: string
  name: string
  imageUrl: string | null
  sessionCount: number
  rating: number
}

interface UserData {
  username?: string | null
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
}

interface Stats {
  totalPlays: number
  uniqueGames: number
}

interface Props {
  user: UserData
  stats: Stats
  allGames: Game[]
  featuredGames: Game[]
  savedFeaturedIds: string[]
  boardgameType: BoardgameType
  savedCardTheme: string
  titles: TitleWithUnlocked[]
}

export function BusinessCardExporter({ user, stats, allGames, featuredGames, savedFeaturedIds, boardgameType, savedCardTheme, titles }: Readonly<Props>) {
  const { showToast } = useToast()
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(savedFeaturedIds)
  const [saving, setSaving] = useState(false)
  const [themeId, setThemeId] = useState(savedCardTheme)
  const [scale, setScale] = useState(0.52)

  let exportLabel = "準備中..."
  if (isReady) exportLabel = "画像DL"
  if (exporting) exportLabel = "生成中..."

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Synchronously measure container width before first paint
  useLayoutEffect(() => {
    if (containerRef.current) {
      setScale(containerRef.current.offsetWidth / 1000)
    }
  }, [])

  // Keep scale updated on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1000)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const theme = getTheme(themeId)

  const displayGames = selectedIds.length > 0
    ? selectedIds.map((id) => allGames.find((g) => g.entryId === id)).filter(Boolean) as Game[]
    : featuredGames

  const toggleGame = (entryId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(entryId)) return prev.filter((id) => id !== entryId)
      if (prev.length >= 3) return prev
      return [...prev, entryId]
    })
  }

  const handleSavePicker = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredEntryIds: selectedIds }),
      })
      if (!res.ok) throw new Error("save failed")
      setShowPicker(false)
    } catch {
      showToast("保存に失敗しました", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = async (id: string) => {
    const prev = themeId
    setThemeId(id)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardTheme: id }),
      })
      if (!res.ok) throw new Error("save failed")
    } catch {
      setThemeId(prev)
      showToast("テーマの保存に失敗しました", "error")
    }
  }

  const generateImage = async (): Promise<string> => {
    if (!cardRef.current) throw new Error("Card ref not found")
    await new Promise((resolve) => setTimeout(resolve, 500))
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#faf7f0",
    })
  }

  const handleExportPNG = async () => {
    setExporting(true)
    setError(null)
    try {
      const dataUrl = await generateImage()
      const link = document.createElement("a")
      link.download = `boardory-card-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch {
      setError("画像の生成に失敗しました")
    } finally {
      setExporting(false)
    }
  }

  const handleShareX = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://boardory.pekori.dev"
    const profileUrl = user.username ? `${baseUrl}/u/${user.username}` : baseUrl
    const lines = [
      "あなたは…",
      "",
      `${boardgameType.icon} ${boardgameType.name}`,
      "",
      boardgameType.description,
      "",
      profileUrl,
      "",
      "#Boardory診断 #ボードゲーム #ボドゲ",
    ]
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "width=550,height=420"
    )
  }

  const previewH = Math.round(560 * scale)

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Hidden card for export */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "1000px", height: "560px" }}>
        <div ref={cardRef}>
          <BusinessCard user={user} stats={stats} featuredGames={displayGames} boardgameType={boardgameType} theme={theme} titles={titles} />
        </div>
      </div>

      {/* Card preview — scale derived from container width */}
      <div className="overflow-hidden rounded-2xl shadow-md" style={{ height: previewH }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1000, height: 560 }}>
          <BusinessCard user={user} stats={stats} featuredGames={displayGames} boardgameType={boardgameType} theme={theme} titles={titles} />
        </div>
      </div>

      {/* Theme swatches */}
      <div className="flex items-start gap-3">
        <p className="mt-1 text-xs font-medium text-amber-800/70 shrink-0">カラー</p>
        <div className="flex flex-wrap gap-2">
          {CARD_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleThemeChange(t.id)}
              title={t.name}
              className="h-6 w-6 rounded-full transition-all focus:outline-none"
              style={{
                background: t.leftBg,
                boxShadow: themeId === t.id
                  ? `0 0 0 2px white, 0 0 0 4px ${t.swatch}`
                  : "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportPNG}
          disabled={exporting || !isReady}
          className="flex-1 rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
        >
          {exportLabel}
        </button>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
        >
          {"ゲームを選ぶ"}{selectedIds.length > 0 ? ` (${selectedIds.length}/3)` : ""}
        </button>
        <button
          onClick={handleShareX}
          className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:outline-none"
        >
          𝕏 でシェア
        </button>
      </div>

      {/* Game Picker */}
      {showPicker && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="mb-3 text-sm font-medium text-amber-900">
            {"名刺に載せるゲームを3つまで選んでください"}
            <span className="ml-2 text-xs font-normal text-amber-700/70">({selectedIds.length}/3)</span>
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 max-h-72 overflow-y-auto pr-1">
            {allGames.map((game) => {
              const selected = selectedIds.includes(game.entryId)
              const disabled = !selected && selectedIds.length >= 3
              return (
                <button
                  key={game.entryId}
                  type="button"
                  onClick={() => toggleGame(game.entryId)}
                  disabled={disabled}
                  className={`relative flex flex-col items-center rounded-lg border-2 p-1.5 text-center transition-all ${
                    selected ? "border-amber-600 bg-amber-100 shadow-sm" : "border-transparent bg-white hover:border-amber-300"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  <div className="relative mb-1 h-14 w-full overflow-hidden rounded bg-amber-50">
                    {game.imageUrl ? (
                      <Image src={game.imageUrl} alt={game.name} fill className="object-contain" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">🎲</div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[10px] leading-tight text-amber-900">{game.name}</p>
                  <p className="mt-0.5 text-[10px] text-amber-500">{"★".repeat(game.rating)}{"☆".repeat(5 - game.rating)}</p>
                  {selected && (
                    <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white">
                      {selectedIds.indexOf(game.entryId) + 1}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => { setSelectedIds(savedFeaturedIds); setShowPicker(false) }}
              className="rounded-lg px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100"
            >
              キャンセル
            </button>
            <button
              onClick={handleSavePicker}
              disabled={saving}
              className="rounded-lg bg-amber-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
