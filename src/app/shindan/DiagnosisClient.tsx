"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
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

interface Props {
  readonly suggestedGames?: SearchGame[]
}

export function DiagnosisClient({ suggestedGames = [] }: Props) {
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
    const url = ids ? `/shindan?games=${ids}` : "/shindan"
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

  const handleDiagnose = () => {
    if (selected.length === 0) return
    const ids = selected.map((g) => g.id).join(",")
    router.push(`/shindan/result?games=${ids}`)
  }

  if (loadingFromUrl) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
      </div>
    )
  }

  let dropdownContent: React.ReactNode = null
  if (results.length > 0 || hasMore) {
    dropdownContent = (
      <>
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
              {loadingMore ? "読み込み中…" : "次の20件を見る"}
            </button>
          </div>
        )}
      </>
    )
  } else if (!searching) {
    dropdownContent = (
      <p className="px-4 py-3 text-sm text-amber-600">見つかりませんでした</p>
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
        <Link
          href="/types"
          className="mt-2 inline-block text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          タイプ一覧を見る →
        </Link>
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

          {showResults && query.trim() && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg"
            >
              {dropdownContent}
            </div>
          )}
        </div>

        {/* 選択済みゲーム（画像グリッド） */}
        {selected.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-medium text-amber-800/60">選択中 {selected.length}件</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {selected.map((g) => (
                <div key={g.id} className="relative">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-amber-100/60">
                    <GameImage
                      src={g.imageUrl}
                      alt={gameName(g)}
                      sizes="80px"
                      className="object-contain p-1"
                      fallbackClassName="flex h-full items-center justify-center text-xl text-amber-300"
                    />
                  </div>
                  <p className="mt-1 line-clamp-1 text-center text-xs leading-tight text-amber-900">
                    {gameName(g)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeGame(g.id)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-800 text-[10px] text-white shadow-sm transition-colors hover:bg-amber-600"
                    aria-label={`${gameName(g)}を削除`}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* 診断するボタン */}
            <button
              type="button"
              onClick={handleDiagnose}
              className="mt-5 w-full rounded-xl bg-amber-900 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
            >
              診断する →
            </button>
          </div>
        )}
      </div>

      {/* 人気のボドゲ */}
      {suggestedGames.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-amber-950">
            人気のボドゲから選ぶ
          </p>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {suggestedGames.map((game) => {
              const already = selected.some((g) => g.id === game.id)
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => !already && addGame(game)}
                  disabled={already}
                  className={`group relative flex flex-col items-center gap-1 transition-opacity ${already ? "opacity-40" : ""}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-amber-100/60 shadow-sm ring-1 ring-amber-200/40 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <GameImage
                      src={game.imageUrl}
                      alt={gameName(game)}
                      sizes="(max-width: 640px) 25vw, 17vw"
                      className="object-contain p-1"
                      fallbackClassName="flex h-full items-center justify-center text-2xl text-amber-300"
                    />
                    {already && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-amber-900/20">
                        <span className="text-lg">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-center text-xs leading-tight text-amber-900">
                    {gameName(game)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
