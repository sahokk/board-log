"use client"

import { useRef, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import { BusinessCard } from "./BusinessCard"
import type { TitleWithUnlocked } from "@/lib/titles"

interface Game {
  id: string
  name: string
  imageUrl: string | null
}

interface UserData {
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
}

interface Stats {
  totalPlays: number
  uniqueGames: number
  averageRating?: string
  wishlistCount?: number
}

interface Props {
  user: UserData
  stats: Stats
  favoriteGames: Game[]
  titles: TitleWithUnlocked[]
}

export function BusinessCardExporter({ user, stats, favoriteGames, titles }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Wait for images to load before enabling export
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1000) // Give images time to load
    return () => clearTimeout(timer)
  }, [])

  const generateImage = async (): Promise<string> => {
    if (!cardRef.current) {
      console.error("Card ref not found")
      throw new Error("Card ref not found")
    }

    console.log("Starting image generation...")

    try {
      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("Generating PNG with html-to-image...")
      // Generate image with simpler settings
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#faf7f2",
      })

      console.log("Image generated successfully")
      return dataUrl
    } catch (err) {
      console.error("Image generation error:", err)
      throw err
    }
  }

  const handleExportPNG = async () => {
    setExporting(true)
    setError(null)

    try {
      const dataUrl = await generateImage()

      // Trigger download
      const link = document.createElement("a")
      link.download = `boardlog-card-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
      setError("画像の生成に失敗しました")
    } finally {
      setExporting(false)
    }
  }

  const handleShare = () => {
    const siteUrl = window.location.origin
    const shareText = `ボードゲームの記録をBoardLogで管理しています！ 🎲\n総プレイ数: ${stats.totalPlays}回 | ゲーム種類: ${stats.uniqueGames}個\n\n${siteUrl}\n\n#BoardLog #ボードゲーム #ボドゲ`

    // Open Twitter with text only
    const tweetText = encodeURIComponent(shareText)
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      "_blank",
      "width=550,height=420"
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden card for export - positioned off-screen but rendered */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          height: "1000px",
        }}
      >
        <div ref={cardRef}>
          <BusinessCard user={user} stats={stats} favoriteGames={favoriteGames} titles={titles} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportPNG}
          disabled={exporting || !isReady}
          className="flex-1 rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
        >
          {exporting ? "生成中..." : !isReady ? "準備中..." : "画像DL"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Xでシェア
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
