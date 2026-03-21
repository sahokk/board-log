"use client"

import { useState } from "react"

interface WishlistButtonProps {
  gameId: string
  initialWishlisted: boolean
  className?: string
}

export function WishlistButton({ gameId, initialWishlisted, className }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const prev = wishlisted
    setWishlisted(!prev)
    try {
      if (prev) {
        const res = await fetch(`/api/wishlist/${gameId}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        })
        if (!res.ok) throw new Error()
      }
    } catch {
      setWishlisted(prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        className ??
        `block w-full rounded-lg border px-4 py-2 text-center text-xs font-medium transition-colors disabled:opacity-50 ${
          wishlisted
            ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100"
            : "border-amber-300 text-amber-800 hover:bg-amber-50"
        }`
      }
      title={wishlisted ? "気になるリストから外す" : "気になるリストに追加"}
    >
      {wishlisted ? "♥ 気になる済" : "♡ 気になる"}
    </button>
  )
}
