"use client"

import { useRef, useState } from "react"
import type { BoardgameType } from "@/lib/boardgame-type"

interface Props {
  type: BoardgameType
}

const AXIS_TOOLTIPS: Record<string, string> = {
  重さ: "BGGのweight値やカテゴリ・メカニクスから算出。重めの戦略ゲームをよく遊ぶほど右に、軽めのカジュアルゲーム寄りだと左になります。",
  探索性: "1ゲームあたりのプレイ回数から算出。多くのゲームを幅広く遊ぶ探索型ほど右に、少数のゲームを深く遊び込む専門型ほど左になります。",
  社交性: "協力ゲームや社会的推理などのメカニクスから算出。協力・パーティ志向ほど右に、競争・勝負志向ほど左になります。",
  テーマ性: "カテゴリから算出。ファンタジー・SF・冒険などの世界観重視ほど右に、経済・抽象戦略などのシステム重視ほど左になります。",
}

function AxisBar({ label, leftLabel, rightLabel, score }: Readonly<{
  label: string
  leftLabel: string
  rightLabel: string
  score: number
}>) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const tooltip = AXIS_TOOLTIPS[label]

  const showTooltip = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <p className="text-xs font-semibold text-amber-800">{label}</p>
        {tooltip && (
          <>
            <button
              ref={btnRef}
              type="button"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-200/60 text-[10px] font-bold text-amber-700 hover:bg-amber-300/60 transition-colors"
              onMouseEnter={showTooltip}
              onMouseLeave={() => setTooltipPos(null)}
              onFocus={showTooltip}
              onBlur={() => setTooltipPos(null)}
              aria-label={`${label}の説明`}
            >
              ?
            </button>
            {tooltipPos && (
              <div
                className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 rounded-lg bg-amber-950 px-3 py-2 shadow-lg"
                style={{ left: tooltipPos.x, top: tooltipPos.y - 8, transform: "translate(-50%, -100%)" }}
              >
                <p className="text-xs leading-relaxed text-amber-100">{tooltip}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-amber-950" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="relative mx-2 h-2 rounded-full bg-amber-100">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-amber-400 to-amber-700"
          style={{ width: `${score}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-amber-700 shadow"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-amber-700/60">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

export function BoardgameTypeCard({ type }: Readonly<Props>) {
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
          <AxisBar label="重さ" leftLabel="カジュアル派" rightLabel="ストラテジー派" score={type.weightScore} />
          <AxisBar label="探索性" leftLabel="極め派" rightLabel="探索派" score={type.varietyScore} />
          <AxisBar label="社交性" leftLabel="競争派" rightLabel="協力/ソーシャル派" score={type.socialScore} />
          <AxisBar label="テーマ性" leftLabel="システム/ユーロ派" rightLabel="テーマ派" score={type.themeScore} />
        </div>
      </div>
    </div>
  )
}
