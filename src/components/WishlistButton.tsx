"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { useToast } from "@/components/Toast"

interface Props {
  gameId: string
  initialWishlisted: boolean
  size?: "icon" | "default"
}

export function WishlistButton({ gameId, initialWishlisted, size = "default" }: Readonly<Props>) {
  const { data: session } = useSession()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const [popping, setPopping] = useState(false)
  const { showToast } = useToast()

  const toggle = async (e: React.MouseEvent) => {
    if (!session?.user.id) {
      signIn(undefined, { callbackUrl: `/games/${gameId}` })
      return
    }
    
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
      if (res.ok) {
        const adding = !wishlisted
        setWishlisted(adding)
        if (adding) {
          setPopping(true)
          showToast("♥ 気になるリストに追加しました")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const heartIcon = (
    <FontAwesomeIcon
      icon={wishlisted ? faHeartSolid : faHeartRegular}
      className={`${wishlisted ? "text-pink-500" : ""} ${popping ? "animate-heart-pop" : ""}`}
      onAnimationEnd={() => setPopping(false)}
    />
  )

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
        {heartIcon}
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
      {heartIcon}
      <span>{wishlisted ? "気になり中" : "気になる"}</span>
    </button>
  )
}
