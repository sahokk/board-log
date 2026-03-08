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
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ゲーム名を入力（例: Catan, 7 Wonders）"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((game) => (
            <div
              key={game.id}
              className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 箱画像 */}
              <div className="relative aspect-square bg-gray-100">
                {game.imageUrl ? (
                  <Image
                    src={game.imageUrl}
                    alt={game.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <span className="text-3xl">🎲</span>
                  </div>
                )}
              </div>

              {/* ゲーム情報 */}
              <div className="flex flex-1 flex-col p-3">
                <p className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">
                  {game.name}
                </p>
                {game.yearPublished && (
                  <p className="mb-3 text-xs text-gray-500">
                    {game.yearPublished}年
                  </p>
                )}
                <div className="mt-auto">
                  <Link
                    href={`/record?gameId=${game.id}`}
                    className="block w-full rounded bg-gray-900 px-3 py-1.5 text-center text-xs text-white hover:bg-gray-700"
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
