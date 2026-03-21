"use client"

import { useState } from "react"

interface Props {
  gameId: string
  initialWishlisted: boolean
  size?: "icon" | "default"
}

export function WishlistButton({ gameId, initialWishlisted, size = "default" }: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      })
      if (res.ok) setWishlisted((v) => !v)
    } finally {
      setLoading(false)
    }
  }

  if (size === "icon") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={wishlisted ? "気になるリストから削除" : "気になるリストに追加"}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow transition-colors disabled:opacity-50 ${
          wishlisted
            ? "bg-white/90 hover:bg-white"
            : "bg-white/80 text-amber-700 hover:bg-amber-50"
        }`}
      >
        {wishlisted ? "🩷" : "🤍"}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
        wishlisted
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "border border-amber-300 text-amber-800 hover:bg-amber-50"
      }`}
    >
      <span>{wishlisted ? "🩷" : "🤍"}</span>
      <span>{wishlisted ? "気になり中" : "気になる"}</span>
    </button>
  )
}
