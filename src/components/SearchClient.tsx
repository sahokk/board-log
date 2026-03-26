"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { GameCard } from "@/components/GameCard"
import { getGameName } from "@/lib/game-utils"

interface GameResult {
  id: string
  bggId?: string | null
  name: string
  nameJa?: string | null
  customNameJa?: string | null
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
}

interface SearchCache {
  query: string
  page: number
  results: GameResult[]
}

const CACHE_KEY = "search_cache"

function getCache(): SearchCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SearchCache
  } catch {
    return null
  }
}

function setCache(data: SearchCache) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // ignore
  }
}

const PAGE_SIZE = 6

export function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlQuery = searchParams.get("q") ?? ""
  const urlPage = Number(searchParams.get("page") ?? "0")

  const [query, setQuery] = useState(urlQuery)
  const [results, setResults] = useState<GameResult[]>([])
  const [page, setPage] = useState(urlPage)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!urlQuery)
  const [error, setError] = useState<string | null>(null)
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const skipInitialFetch = useRef(false)

  // マウント後にキャッシュを適用（SSRと初回レンダーを一致させるため useEffect で行う）
  useEffect(() => {
    const cached = getCache()
    if (cached?.query === urlQuery && urlQuery !== "") {
      setResults(cached.results)
      setPage(cached.page)
      setSearched(true)
      skipInitialFetch.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.items) {
          setWishlistedIds(new Set(data.items.map((i: { gameId: string }) => i.gameId)))
        }
      })
      .catch(() => {})
  }, [])

  // キャッシュ保存
  useEffect(() => {
    if (query.trim() && results.length > 0) {
      setCache({ query: query.trim(), page, results })
    } else if (!query.trim()) {
      clearCache()
    }
  }, [query, page, results])

  // URL同期
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (page > 0) params.set("page", String(page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [query, page, pathname, router])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setError(null)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = isFirstRender.current ? 0 : 500
    const isFirst = isFirstRender.current
    isFirstRender.current = false

    // キャッシュヒット時は初回フェッチをスキップ
    if (isFirst && skipInitialFetch.current) {
      setSearched(true)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      setSearched(true)
      if (delay > 0) setPage(0)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Search failed")
        setResults(data.games ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました")
        setResults([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const displayed = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const startNum = page * PAGE_SIZE + 1
  const endNum = Math.min((page + 1) * PAGE_SIZE, results.length)

  function gameDetailHref(game: GameResult): string {
    return `/games/${game.id}`
  }

  return (
    <div>
      {/* 検索フォーム */}
      <div className="mb-8 flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ゲーム名を入力（例: Catan, 7 Wonders）"
          className="flex-1 rounded-xl border border-amber-200 bg-amber-50/30 px-5 py-3 text-sm text-amber-950 shadow-sm placeholder:text-amber-700/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        {loading && (
          <span className="shrink-0 text-sm text-amber-700/60">検索中...</span>
        )}
      </div>

      {/* 結果なし */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="text-center">
          <p className="mb-4 text-sm text-amber-800/70">
            「{query}」に一致するゲームが見つかりませんでした。
          </p>
        </div>
      )}

      {/* 検索結果グリッド */}
      {results.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {displayed.map((game) => (
              <GameCard
                key={game.id}
                gameId={game.id}
                detailHref={gameDetailHref(game)}
                name={getGameName(game)}
                imageUrl={game.imageUrl}
                subtext={(game.customNameJa ?? game.nameJa) ? game.name : undefined}
                year={game.yearPublished}
                wishlisted={wishlistedIds.has(game.id)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
              />
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← 前の結果
              </button>

              <span className="text-xs text-amber-800/60">
                {startNum}〜{endNum} 件 / 全{results.length}件
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                次の結果 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
