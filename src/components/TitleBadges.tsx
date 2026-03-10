"use client"

import { useState } from "react"
import type { TitleWithUnlocked } from "@/lib/titles"

interface Props {
  titles: TitleWithUnlocked[]
}

export function TitleBadges({ titles }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const unlockedCount = titles.filter((t) => t.unlocked).length

  return (
    <div className="wood-card rounded-2xl p-6 shadow-sm">
      <p className="mb-4 text-sm text-amber-800">
        <span className="font-bold text-amber-950">{unlockedCount}</span> / {titles.length} 獲得
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {titles.map((title) => (
          <div
            key={title.id}
            className="relative"
            onMouseEnter={() => setActiveTooltip(title.id)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div
              className={`flex flex-col items-center rounded-xl p-3 text-center transition-all ${
                title.unlocked
                  ? "bg-amber-50 shadow-sm"
                  : "bg-gray-100 opacity-40 grayscale"
              }`}
            >
              <span className="mb-1.5 text-2xl">{title.icon}</span>
              <span
                className={`text-xs font-medium leading-tight ${
                  title.unlocked ? "text-amber-950" : "text-gray-500"
                }`}
              >
                {title.name}
              </span>
            </div>

            {/* Tooltip */}
            {activeTooltip === title.id && (
              <div className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-lg bg-amber-950 px-3 py-2 text-center shadow-lg">
                <p className="text-xs font-medium text-white">{title.name}</p>
                <p className="mt-0.5 text-xs text-amber-200">{title.description}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-amber-950" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
