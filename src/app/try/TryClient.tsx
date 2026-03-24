"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { calculateBoardgameType } from "@/lib/boardgame-type"
import { BoardgameTypeCard } from "@/components/BoardgameTypeCard"
import { GameImage } from "@/components/GameImage"
import { getGameName } from "@/lib/game-utils"

interface SearchGame {
  id: string
  name: string
  nameJa: string | null
  customNameJa: string | null
  imageUrl?: string | null
  mechanics?: string | null
  categories?: string | null
  weight?: number | null
}

export function TryClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchGame[]>([])
  const [bggTotal, setBggTotal] = useState(0)
  const [bggOffset, setBggOffset] = useState(0)
  const [selected, setSelected] = useState<SearchGame[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loadingFromUrl, setLoadingFromUrl] = useState(false)
  const [copied, setCopied] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URLからゲームを復元（初回マウント時のみ）
  useEffect(() => {
    const gamesParam = searchParams.get("games")
    if (!gamesParam) return
    const ids = gamesParam.split(",").filter(Boolean)
    if (ids.length === 0) return

    setLoadingFromUrl(true)
    fetch(`/api/games/batch?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.games?.length > 0) setSelected(data.games)
      })
      .catch(() => {})
      .finally(() => setLoadingFromUrl(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 選択ゲームが変わったらURLを更新
  useEffect(() => {
    const ids = selected.map((g) => g.id).join(",")
    const url = ids ? `/try?games=${ids}` : "/try"
    router.replace(url, { scroll: false })
  }, [selected, router])

  // 検索デバウンス
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setBggTotal(0)
      setBggOffset(0)
      setShowResults(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setResults([])
      setBggTotal(0)
      setBggOffset(0)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.games ?? [])
        setBggTotal(data.bggTotal ?? 0)
        setBggOffset(0)
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
    setBggTotal(0)
    setBggOffset(0)
    inputRef.current?.focus()
  }

  const removeGame = (id: string) => setSelected((prev) => prev.filter((g) => g.id !== id))

  const gameName = (g: SearchGame) => getGameName(g)

  const handleLoadMore = async () => {
    const nextOffset = bggOffset + 20
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/games/search?q=${encodeURIComponent(query.trim())}&offset=${nextOffset}`
      )
      const data = await res.json()
      const newGames: SearchGame[] = data.games ?? []
      setResults((prev) => {
        const seenIds = new Set(prev.map((g) => g.id))
        return [...prev, ...newGames.filter((g) => !seenIds.has(g.id))]
      })
      setBggOffset(nextOffset)
      setBggTotal(data.bggTotal ?? bggTotal)
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = bggTotal > bggOffset + 20

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

  const handleShareX = () => {
    if (!boardgameType) return
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""
    const lines = [
      "あなたは…",
      "",
      `${boardgameType.icon} ${boardgameType.name}`,
      "",
      boardgameType.description,
      "",
      currentUrl,
      "",
      "#Boardory診断 #ボードゲーム #ボドゲ",
    ]
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "width=550,height=420"
    )
  }

  const handleCopyUrl = async () => {
    if (typeof window === "undefined") return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (loadingFromUrl) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <p className="mb-3 text-4xl">🎲</p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">ボドゲタイプ診断</h1>
        <p className="mt-3 text-sm text-amber-800/70">
          遊んだゲームを選ぶだけ。ログイン不要で診断できます
        </p>
      </div>

      {/* ゲーム検索 */}
      <div className="wood-card rounded-2xl p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-amber-950">
          遊んだゲームを選ぼう{" "}
          <span className="font-normal text-amber-700/60">（1件から診断できます）</span>
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

          {showResults && (results.length > 0 || hasMore) && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg"
            >
              <div className="max-h-72 overflow-y-auto">
                {results.map((game) => {
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
              {hasMore && (
                <div className="border-t border-amber-100">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-amber-300 border-t-amber-700" />
                        読み込み中…
                      </>
                    ) : (
                      <>次の20件を見る</>
                    )}
                  </button>
                </div>
              )}
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
        <div className="mt-8 space-y-4">
          <BoardgameTypeCard type={boardgameType} />

          {/* アクション */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
            >
              {copied ? "✓ コピーしました" : "🔗 URLをコピー"}
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
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-center">
            <p className="text-sm font-medium text-amber-950">記録を残して本格診断しよう</p>
            <p className="mt-1 text-xs text-amber-800/70">
              ゲームを登録すると、プレイ回数が反映されてより精度の高い診断になります
            </p>
            <Link
              href="/api/auth/signin"
              className="mt-3 inline-block rounded-lg bg-amber-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800"
            >
              ログインして始める
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
