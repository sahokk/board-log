"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ManualGameForm } from "@/components/ManualGameForm"
import { WishlistButton } from "@/components/WishlistButton"
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

interface Props {
  readonly username?: string | null
}

const PAGE_SIZE = 6

export function SearchClient({ username }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GameResult[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setError(null)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      setSearched(true)
      setShowManualForm(false)
      setPage(0)
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
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (showManualForm) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold text-amber-950">ゲームを手動で追加</h2>
        <div className="wood-card rounded-2xl p-6 shadow-sm">
          <ManualGameForm
            onCancel={() => setShowManualForm(false)}
            initialName={query}
          />
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const displayed = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const startNum = page * PAGE_SIZE + 1
  const endNum = Math.min((page + 1) * PAGE_SIZE, results.length)

  function gameDetailHref(game: GameResult): string {
    if (username) return `/u/${username}/games/${game.id}`
    return `/record?gameId=${game.id}`
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

      {/* エラー */}
      {error && (
        <div className="mb-6">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setShowManualForm(true)}
            className="mt-3 rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
          >
            ゲームを手動で追加
          </button>
        </div>
      )}

      {/* 結果なし */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="text-center">
          <p className="mb-4 text-sm text-amber-800/70">
            「{query}」に一致するゲームが見つかりませんでした。
          </p>
          <button
            onClick={() => setShowManualForm(true)}
            className="rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
          >
            ゲームを手動で追加
          </button>
        </div>
      )}

      {/* 検索結果グリッド */}
      {results.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {displayed.map((game) => (
              <div
                key={game.id}
                className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm"
              >
                {/* 箱画像＋名前 → 詳細ページへ */}
                <Link
                  href={gameDetailHref(game)}
                  className="flex flex-1 flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={getGameName(game)}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-amber-300">
                        <span className="text-4xl">🎲</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 pb-1 pt-2">
                    <p className="line-clamp-2 text-xs font-semibold text-amber-950">
                      {getGameName(game)}
                    </p>
                    {(game.customNameJa ?? game.nameJa) && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-amber-700/50">
                        {game.name}
                      </p>
                    )}
                    {game.yearPublished && (
                      <p className="mt-0.5 text-xs font-medium text-amber-700/60">
                        {game.yearPublished}年
                      </p>
                    )}
                  </div>
                </Link>

                {/* アクションボタン */}
                <div className="flex flex-col gap-1.5 px-3 pb-3">
                  <Link
                    href={`/record?gameId=${game.id}`}
                    className="block w-full rounded-lg bg-amber-900 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
                  >
                    遊んだ！
                  </Link>
                  <WishlistButton
                    gameId={game.id}
                    initialWishlisted={wishlistedIds.has(game.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← 前の結果
              </button>

              <span className="text-xs text-amber-800/60">
                {startNum}〜{endNum} 件 / 全{results.length}件
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                次の結果 →
              </button>
            </div>
          )}

          {/* 手動追加 */}
          <div className="mt-6 text-center">
            <p className="mb-2 text-sm text-amber-800/70">
              お探しのゲームが見つかりませんか？
            </p>
            <button
              onClick={() => setShowManualForm(true)}
              className="text-sm font-medium text-amber-900 underline transition-colors hover:text-amber-700"
            >
              ゲームを手動で追加する
            </button>
          </div>
        </>
      )}

      {/* 未検索状態 */}
      {!searched && !loading && (
        <div className="text-center">
          <p className="mb-4 text-sm text-amber-800/70">
            ゲーム名で検索するか、手動で追加できます
          </p>
          <button
            onClick={() => setShowManualForm(true)}
            className="text-sm font-medium text-amber-900 underline transition-colors hover:text-amber-700"
          >
            ゲームを手動で追加する
          </button>
        </div>
      )}
    </div>
  )
}
