"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { toPng } from "html-to-image"
import { BusinessCard } from "./BusinessCard"
import type { TitleWithUnlocked } from "@/lib/titles"
import type { BoardgameType } from "@/lib/boardgame-type"

interface Game {
  id: string
  entryId: string
  name: string
  imageUrl: string | null
  sessionCount: number
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
  boardgameType: BoardgameType | null
  titles: TitleWithUnlocked[]
}

export function BusinessCardExporter({ user, stats, allGames, featuredGames, savedFeaturedIds, boardgameType, titles }: Readonly<Props>) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(savedFeaturedIds)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Derive the 3 games to show on the card
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
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredEntryIds: selectedIds }),
      })
      setShowPicker(false)
    } finally {
      setSaving(false)
    }
  }

  const generateImage = async (): Promise<string> => {
    if (!cardRef.current) throw new Error("Card ref not found")
    await new Promise((resolve) => setTimeout(resolve, 500))
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#faf7f2",
    })
  }

  const handleExportPNG = async () => {
    setExporting(true)
    setError(null)
    try {
      const dataUrl = await generateImage()
      const link = document.createElement("a")
      link.download = `boardlog-card-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch {
      setError("画像の生成に失敗しました")
    } finally {
      setExporting(false)
    }
  }

  const handleShare = () => {
    const siteUrl = window.location.origin
    const shareText = `ボードゲームの記録をBoardLogで管理しています！ 🎲\n総プレイ数: ${stats.totalPlays}回 | ゲーム種類: ${stats.uniqueGames}個\n\n${siteUrl}\n\n#BoardLog #ボードゲーム #ボドゲ`
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "width=550,height=420"
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden card for export */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "800px", height: "1000px" }}>
        <div ref={cardRef}>
          <BusinessCard
            user={user}
            stats={stats}
            featuredGames={displayGames}
            boardgameType={boardgameType}
            titles={titles}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportPNG}
          disabled={exporting || !isReady}
          className="flex-1 rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
        >
          {exporting ? "生成中..." : !isReady ? "準備中..." : "画像DL"}
        </button>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
        >
          ゲームを選ぶ {selectedIds.length > 0 ? `(${selectedIds.length}/3)` : ""}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Xでシェア
        </button>
      </div>

      {/* Game Picker */}
      {showPicker && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="mb-3 text-sm font-medium text-amber-900">
            名刺に載せるゲームを3つまで選んでください
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
                    selected
                      ? "border-amber-600 bg-amber-100 shadow-sm"
                      : "border-transparent bg-white hover:border-amber-300"
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
