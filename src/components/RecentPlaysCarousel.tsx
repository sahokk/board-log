"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

interface Play {
  id: string
  game: {
    id: string
    name: string
    imageUrl: string | null
  }
}

interface Props {
  plays: Play[]
}

export function RecentPlaysCarousel({ plays }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollPosition = 0
    const scrollSpeed = 0.5 // ピクセル/フレーム

    const scroll = () => {
      scrollPosition += scrollSpeed

      // スクロール位置が最後に到達したら最初に戻る
      if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollPosition = 0
      }

      scrollContainer.scrollLeft = scrollPosition
    }

    const intervalId = setInterval(scroll, 16) // 約60fps

    // ホバー時にスクロールを停止
    const handleMouseEnter = () => clearInterval(intervalId)
    const handleMouseLeave = () => {
      const newIntervalId = setInterval(scroll, 16)
      return () => clearInterval(newIntervalId)
    }

    scrollContainer.addEventListener("mouseenter", handleMouseEnter)
    scrollContainer.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      clearInterval(intervalId)
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter)
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <div className="relative -mx-6 px-6">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 無限スクロールのために2回表示 */}
        {[...plays, ...plays].map((play, index) => (
          <div
            key={`${play.id}-${index}`}
            className="group shrink-0 w-48"
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              {/* 箱画像 */}
              <div className="relative aspect-square bg-linear-to-br from-gray-50 to-gray-100">
                {play.game.imageUrl ? (
                  <Image
                    src={play.game.imageUrl}
                    alt={play.game.name}
                    fill
                    className="object-contain p-4"
                    sizes="192px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <span className="text-4xl">🎲</span>
                  </div>
                )}
              </div>

              {/* タイトルのみ */}
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                  {play.game.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
