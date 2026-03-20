"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ManualGameForm } from "@/components/ManualGameForm"
import { BggAttribution } from "@/components/BggAttribution"

interface GameResult {
  id: string
  bggId?: string | null
  name: string
  nameJa?: string | null
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
}

const PAGE_SIZE = 5

export function SearchClient() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GameResult[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const handleSearch = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setSearched(true)
    setShowManualForm(false)
    setPage(0)

    try {
      const res = await fetch(
        `/api/games/search?q=${encodeURIComponent(query.trim())}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Search failed")
      setResults(data.games ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setResults([])
    } finally {
      setLoading(false)
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

  return (
    <div>
      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ゲーム名を入力（例: Catan, 7 Wonders）"
          className="flex-1 rounded-xl border border-amber-200 bg-amber-50/30 px-5 py-3 text-sm text-amber-950 shadow-sm placeholder:text-amber-700/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:opacity-50"
        >
          {loading ? "検索中..." : "検索"}
        </button>
      </form>

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
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayed.map((game) => (
              <div
                key={game.id}
                className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                {/* 箱画像 */}
                <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={game.nameJa ?? game.name}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-amber-300">
                      <span className="text-4xl">🎲</span>
                    </div>
                  )}
                </div>

                {/* ゲーム情報 */}
                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-0.5 line-clamp-2 text-sm font-semibold text-amber-950">
                    {game.nameJa ?? game.name}
                  </p>
                  {game.nameJa && (
                    <p className="mb-1 line-clamp-1 text-xs text-amber-700/50">
                      {game.name}
                    </p>
                  )}
                  {game.yearPublished && (
                    <p className="mb-3 text-xs font-medium text-amber-700/60">
                      {game.yearPublished}年
                    </p>
                  )}
                  <div className="mt-auto flex flex-col gap-2">
                    <Link
                      href={`/record?gameId=${game.id}`}
                      className="block w-full rounded-lg bg-amber-900 px-4 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
                    >
                      記録する
                    </Link>
                    {game.bggId && (
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-lg border border-amber-300 px-4 py-2 text-center text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
                      >
                        BGGで見る
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション */}
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

          {/* BGG クレジット + 手動追加 */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <BggAttribution />
            <div className="text-center">
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
          </div>
        </>
      )}

      {/* Initial state - before search */}
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
