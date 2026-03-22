"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import type { BoardgameType, BoardoryAxis } from "@/lib/boardgame-type"

interface Props {
  type: BoardgameType
}

const AXIS_CONFIG: {
  key: BoardoryAxis
  label: string
  leftLabel: string
  rightLabel: string
  tooltip: string
}[] = [
  {
    key: "strategy",
    label: "戦略性",
    leftLabel: "直感派",
    rightLabel: "思考派",
    tooltip:
      "ゲームのメカニクス（ワーカープレイスメント・エンジン構築など）とBGGのweight値から算出。思考を要するゲームをよく遊ぶほど高くなります。",
  },
  {
    key: "interaction",
    label: "対人性",
    leftLabel: "マイペース",
    rightLabel: "バチバチ派",
    tooltip:
      "エリアコントロール・交渉・ブラフなど他プレイヤーへの干渉度から算出。駆け引きや対決を楽しむゲームほど高くなります。",
  },
  {
    key: "party",
    label: "盛り上がり",
    leftLabel: "静か派",
    rightLabel: "パーティ派",
    tooltip:
      "パーティゲームやロールプレイ・ストーリーテリングなどのメカニクスから算出。場を盛り上げるゲームほど高くなります。",
  },
  {
    key: "luck",
    label: "運要素",
    leftLabel: "実力主義",
    rightLabel: "運ゲー好き",
    tooltip:
      "ダイスロール・プッシュユアラック・ランダム生産などのメカニクスから算出。運が勝敗に影響するゲームほど高くなります。",
  },
  {
    key: "speed",
    label: "テンポ",
    leftLabel: "じっくり派",
    rightLabel: "スピード派",
    tooltip:
      "リアルタイム系やスピードマッチングなどから算出。テンポよく進むゲームほど高く、重い戦略ゲームは低くなります。",
  },
]

function AxisBar({
  label,
  leftLabel,
  rightLabel,
  score,
  tooltip,
}: Readonly<{
  label: string
  leftLabel: string
  rightLabel: string
  score: number
  tooltip: string
}>) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const showTooltip = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(rect.left + rect.width / 2, 112), window.innerWidth - 112)
    setTooltipPos({ x, y: rect.top })
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <p className="text-xs font-semibold text-amber-800">{label}</p>
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
            className="pointer-events-none fixed z-50 w-56 rounded-lg bg-amber-950 px-3 py-2 shadow-lg"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 8}px`, transform: "translate(-50%, -100%)" }}
          >
            <p className="text-xs leading-relaxed text-amber-100">{tooltip}</p>
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-amber-950" />
          </div>
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
          <type.icon size={48} className="text-white" />
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{type.name}</h3>
            <p className="text-sm text-amber-300">{type.tagline}</p>
          </div>
        </div>
        {/* サブタイプ */}
        <p className="mt-2 text-xs text-amber-400/80">― {type.subType}</p>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="mb-5 text-sm leading-relaxed text-amber-900">{type.description}</p>

        <div className="space-y-4">
          {AXIS_CONFIG.map(({ key, label, leftLabel, rightLabel, tooltip }) => (
            <AxisBar
              key={key}
              label={label}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              score={type.scores[key]}
              tooltip={tooltip}
            />
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link href="/types" className="text-xs text-amber-700 underline hover:text-amber-950">
            すべてのタイプを見る →
          </Link>
        </div>
      </div>
    </div>
  )
}
