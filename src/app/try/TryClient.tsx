"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import Link from "next/link"
import { toPng } from "html-to-image"
import { calculateBoardgameType } from "@/lib/boardgame-type"
import { calculateTitles } from "@/lib/titles"
import { BusinessCard } from "@/components/BusinessCard"
import { BoardgameTypeCard } from "@/components/BoardgameTypeCard"
import { GameImage } from "@/components/GameImage"
import { CARD_THEMES, getTheme } from "@/lib/card-themes"

interface SearchGame {
  id: string
  name: string
  nameJa: string | null
  imageUrl?: string | null
  mechanics?: string | null
  categories?: string | null
  weight?: number | null
}

export function TryClient() {
  const [displayName, setDisplayName] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchGame[]>([])
  const [selected, setSelected] = useState<SearchGame[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [themeId, setThemeId] = useState("amber")
  const [exporting, setExporting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [scale, setScale] = useState(0.55)

  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 800)
    return () => clearTimeout(t)
  }, [])

  useLayoutEffect(() => {
    if (containerRef.current) {
      setScale(containerRef.current.offsetWidth / 1000)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1000))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // 検索デバウンス
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.games ?? [])
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        inputRef.current?.contains(e.target as Node)
      ) return
      setShowResults(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const addGame = (game: SearchGame) => {
    if (!selected.some((g) => g.id === game.id)) {
      setSelected((prev) => [...prev, game])
    }
    setQuery("")
    setShowResults(false)
    setResults([])
    inputRef.current?.focus()
  }

  const removeGame = (id: string) => setSelected((prev) => prev.filter((g) => g.id !== id))

  const gameName = (g: SearchGame) => g.nameJa ?? g.name

  // クライアント側で計算
  const boardgameType =
    selected.length > 0
      ? calculateBoardgameType({
          entries: selected.map((g) => ({ gameId: g.id, sessionCount: 1 })),
          games: selected.map((g) => ({
            gameId: g.id,
            weight: g.weight ?? null,
            categories: g.categories ?? null,
            mechanics: g.mechanics ?? null,
          })),
        })
      : null

  const titles =
    selected.length > 0
      ? calculateTitles({
          entries: selected.map((g) => ({ gameId: g.id, rating: 0 })),
          sessions: [],
          games: selected.map((g) => ({
            categories: g.categories ?? null,
            mechanics: g.mechanics ?? null,
          })),
          wishlistCount: 0,
        })
      : []

  const effectiveName = displayName.trim() || "ゲスト"
  const user = {
    displayName: effectiveName,
    username: null as string | null,
    name: null as string | null,
    customImageUrl: null as string | null,
    image: null as string | null,
    favoriteGenres: null as string | null,
  }
  const stats = { totalPlays: selected.length, uniqueGames: selected.length }
  const featuredGames = selected.slice(0, 3).map((g) => ({
    id: g.id,
    name: gameName(g),
    imageUrl: g.imageUrl ?? null,
  }))
  const theme = getTheme(themeId)
  const previewH = Math.round(560 * scale)

  const handleExportPNG = async () => {
    if (!cardRef.current || !boardgameType) return
    setExporting(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#faf7f0",
      })
      const link = document.createElement("a")
      link.download = `boardory-card-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setExporting(false)
    }
  }

  const handleShareX = () => {
    if (!boardgameType) return
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://boardory.pekori.dev"
    const lines = [
      "あなたは…",
      "",
      `${boardgameType.icon} ${boardgameType.name}`,
      "",
      boardgameType.description,
      "",
      baseUrl,
      "",
      "#Boardory診断 #ボードゲーム #ボドゲ",
    ]
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "width=550,height=420"
    )
  }

  return (
    <div ref={containerRef}>
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <p className="mb-3 text-4xl">🎲</p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">ゲストで試す</h1>
        <p className="mt-3 text-sm text-amber-800/70">
          ログイン不要でボドゲタイプ診断と名刺を作れます
        </p>
      </div>

      {/* ニックネーム */}
      <div className="wood-card mb-4 rounded-2xl p-5 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-amber-950">
          ニックネーム<span className="ml-1 font-normal text-amber-700/60">（任意）</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="名前を入力…"
          maxLength={30}
          className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-2.5 text-sm text-amber-950 placeholder-amber-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
        />
      </div>

      {/* ゲーム検索 */}
      <div className="wood-card rounded-2xl p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-amber-950">
          遊んだゲームを選ぼう
          <span className="ml-1.5 font-normal text-amber-700/60">（1件から診断できます）</span>
        </p>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="ゲーム名で検索…"
            className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          />
          {searching && (
            <div className="absolute right-3 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
          )}

          {showResults && results.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg"
            >
              {results.slice(0, 10).map((game) => {
                const already = selected.some((g) => g.id === game.id)
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => !already && addGame(game)}
                    disabled={already}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      already ? "bg-amber-50 text-amber-400" : "hover:bg-amber-50 text-amber-950"
                    }`}
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-amber-100">
                      <GameImage
                        src={game.imageUrl}
                        alt={gameName(game)}
                        sizes="32px"
                        className="object-contain"
                        fallbackClassName="flex h-full items-center justify-center text-sm text-amber-400"
                      />
                    </div>
                    <span className="flex-1 truncate">{gameName(game)}</span>
                    {already && <span className="shrink-0 text-xs text-amber-400">追加済み</span>}
                  </button>
                )
              })}
            </div>
          )}

          {showResults && !searching && results.length === 0 && query.trim() && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-600 shadow-lg"
            >
              見つかりませんでした
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/70 py-1 pl-3 pr-2 text-xs font-medium text-amber-900"
              >
                {gameName(g)}
                <button
                  type="button"
                  onClick={() => removeGame(g.id)}
                  className="text-amber-400 transition-colors hover:text-amber-700"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 診断結果 */}
      {boardgameType && (
        <div className="mt-8 space-y-6">
          <BoardgameTypeCard type={boardgameType} />

          {/* 名刺 */}
          <div className="wood-card rounded-2xl p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
              <span>🎴</span>ボドゲ名刺
            </h2>

            {/* エクスポート用（画面外） */}
            <div style={{ position: "absolute", left: "-9999px", top: 0, width: "1000px", height: "560px" }}>
              <div ref={cardRef}>
                <BusinessCard
                  user={user}
                  stats={stats}
                  featuredGames={featuredGames}
                  boardgameType={boardgameType}
                  theme={theme}
                  titles={titles}
                />
              </div>
            </div>

            {/* プレビュー */}
            <div className="overflow-hidden rounded-xl shadow-md" style={{ height: previewH }}>
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: 1000,
                  height: 560,
                }}
              >
                <BusinessCard
                  user={user}
                  stats={stats}
                  featuredGames={featuredGames}
                  boardgameType={boardgameType}
                  theme={theme}
                  titles={titles}
                />
              </div>
            </div>

            {/* テーマ */}
            <div className="mt-4 flex items-center gap-3">
              <p className="shrink-0 text-xs font-medium text-amber-800/70">カラー</p>
              <div className="flex flex-wrap gap-2">
                {CARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    title={t.name}
                    className="h-6 w-6 rounded-full transition-all focus:outline-none"
                    style={{
                      background: t.leftBg,
                      boxShadow:
                        themeId === t.id
                          ? `0 0 0 2px white, 0 0 0 4px ${t.swatch}`
                          : "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* アクション */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleExportPNG}
                disabled={exporting || !isReady}
                className="flex-1 rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
              >
                {exporting ? "生成中…" : "画像DL"}
              </button>
              <button
                type="button"
                onClick={handleShareX}
                className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                𝕏 でシェア
              </button>
            </div>

            {/* ログインCTA */}
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center">
              <p className="text-sm text-amber-900">
                記録を保存してより詳しく診断したい方は
              </p>
              <Link
                href="/api/auth/signin"
                className="mt-2 inline-block rounded-lg bg-amber-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800"
              >
                ログインして始める
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
