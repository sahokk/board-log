"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { GameImage } from "@/components/GameImage"

interface Game {
  id: string
  name: string
  nameJa: string | null
  imageUrl?: string | null
}

export function OnboardingClient({ isLoggedIn }: { readonly isLoggedIn: boolean }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Game[]>([])
  const [selected, setSelected] = useState<Game[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const addGame = (game: Game) => {
    if (!selected.some((g) => g.id === game.id)) {
      setSelected((prev) => [...prev, game])
    }
    setQuery("")
    setShowResults(false)
    setResults([])
    inputRef.current?.focus()
  }

  const removeGame = (id: string) => {
    setSelected((prev) => prev.filter((g) => g.id !== id))
  }

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      router.push("/api/auth/signin?callbackUrl=/onboarding")
      return
    }
    if (selected.length === 0 || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/plays/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds: selected.map((g) => g.id) }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push("/plays"), 1200)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <p className="text-xl font-bold text-amber-950">登録完了！</p>
        <p className="mt-2 text-sm text-amber-800/70">プレイ履歴に移動します…</p>
      </div>
    )
  }

  const gameName = (g: Game) => g.nameJa ?? g.name

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <p className="mb-3 text-4xl">🎲</p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">
          遊んだゲームをまとめて登録しよう
        </h1>
        <p className="mt-3 text-sm text-amber-800/70">
          日付なしで一括登録できます。後から日付や評価を追加できます。
        </p>
      </div>

      {/* 検索エリア */}
      <div className="wood-card rounded-2xl p-6 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-amber-950">ゲームを検索して追加</p>

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

          {/* 検索結果ドロップダウン */}
          {showResults && results.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg"
            >
              {results.slice(0, 10).map((game) => {
                const alreadySelected = selected.some((g) => g.id === game.id)
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => !alreadySelected && addGame(game)}
                    disabled={alreadySelected}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      alreadySelected
                        ? "bg-amber-50 text-amber-400"
                        : "hover:bg-amber-50 text-amber-950"
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
                    {alreadySelected && (
                      <span className="shrink-0 text-xs text-amber-400">追加済み</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {showResults && !searching && results.length === 0 && query.trim() && (
            <div ref={dropdownRef} className="absolute z-20 mt-1 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-600 shadow-lg">
              見つかりませんでした
            </div>
          )}
        </div>

        {/* 選択済みゲーム一覧 */}
        {selected.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700/70">
              選択中 — {selected.length}件
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selected.map((game) => (
                <div
                  key={game.id}
                  className="group relative flex items-center gap-2 rounded-xl border border-amber-200 bg-white/60 px-3 py-2"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-amber-50">
                    <GameImage
                      src={game.imageUrl}
                      alt={gameName(game)}
                      sizes="32px"
                      className="object-contain"
                      fallbackClassName="flex h-full items-center justify-center text-sm text-amber-300"
                    />
                  </div>
                  <span className="flex-1 truncate text-xs font-medium text-amber-950">
                    {gameName(game)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id)}
                    className="ml-1 shrink-0 text-amber-300 transition-colors hover:text-amber-700"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 登録ボタン */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitting}
          className="w-full rounded-xl bg-amber-900 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "登録中…"
            : !isLoggedIn
              ? `ログインして ${selected.length > 0 ? `${selected.length}件を` : ""}登録する`
              : selected.length > 0
                ? `${selected.length}件のゲームを登録する`
                : "ゲームを選んでください"}
        </button>

        {!isLoggedIn && selected.length > 0 && (
          <p className="mt-2 text-center text-xs text-amber-700/60">
            Googleアカウントでログインして登録します
          </p>
        )}
      </div>
    </div>
  )
}
