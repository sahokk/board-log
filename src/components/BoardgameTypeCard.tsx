"use client"

import type { BoardgameType } from "@/lib/boardgame-type"

interface Props {
  type: BoardgameType
}

function AxisBar({ label, leftLabel, rightLabel, score }: {
  label: string
  leftLabel: string
  rightLabel: string
  score: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-amber-700/70">
        <span>{leftLabel}</span>
        <span className="font-medium text-amber-800">{label}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-2 rounded-full bg-amber-100">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-amber-400 to-amber-700"
          style={{ width: `${score}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-amber-700 shadow"
          style={{ left: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function BoardgameTypeCard({ type }: Props) {
  return (
    <div className="wood-card overflow-hidden rounded-2xl shadow-sm">
      {/* Header */}
      <div className="bg-linear-to-br from-amber-800 to-amber-950 px-6 py-5 text-white">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-amber-300/80">
          ボードゲームタイプ
        </p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{type.icon}</span>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{type.name}</h3>
            <p className="text-sm text-amber-300">{type.tagline}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="mb-5 text-sm leading-relaxed text-amber-900">{type.description}</p>

        <div className="space-y-4">
          <AxisBar
            label="重さ"
            leftLabel="カジュアル派"
            rightLabel="ストラテジー派"
            score={type.weightScore}
          />
          <AxisBar
            label="プレイスタイル"
            leftLabel="極め派"
            rightLabel="探索派"
            score={type.varietyScore}
          />
        </div>
      </div>
    </div>
  )
}
