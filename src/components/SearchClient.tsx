"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"

interface GameResult {
  id: string
  name: string
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
}

export function SearchClient() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setSearched(true)

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

  return (
    <div>
      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ゲーム名を入力（例: Catan, 7 Wonders）"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md disabled:opacity-50"
        >
          {loading ? "検索中..." : "検索"}
        </button>
      </form>

      {/* エラー */}
      {error && (
        <p className="mb-6 text-sm text-red-600">{error}</p>
      )}

      {/* 結果なし */}
      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          「{query}」に一致するゲームが見つかりませんでした。
        </p>
      )}

      {/* 検索結果グリッド */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((game) => (
            <div
              key={game.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              {/* 箱画像 */}
              <div className="relative aspect-square bg-linear-to-br from-gray-50 to-gray-100">
                {game.imageUrl ? (
                  <Image
                    src={game.imageUrl}
                    alt={game.name}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <span className="text-4xl">🎲</span>
                  </div>
                )}
              </div>

              {/* ゲーム情報 */}
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900">
                  {game.name}
                </p>
                {game.yearPublished && (
                  <p className="mb-3 text-xs font-medium text-gray-400">
                    {game.yearPublished}年
                  </p>
                )}
                <div className="mt-auto">
                  <Link
                    href={`/record?gameId=${game.id}`}
                    className="block w-full rounded-lg bg-gray-900 px-4 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    記録する
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
