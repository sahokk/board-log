"use client"

import { useState } from "react"
import type { BoardgameType } from "@/lib/boardgame-type"

interface Props {
  readonly type: BoardgameType
  readonly resultUrl: string
}

export function ResultShareButtons({ type, resultUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const shareText = [
    `私のボドゲタイプは… ${type.icon} ${type.name}！`,
    "",
    type.description,
    "",
    "あなたのタイプも診断してみよう 🎲",
    resultUrl,
    "",
    "#Boardory診断 #ボードゲーム #ボドゲ",
  ].join("\n")

  const copyText = [
    `私のボドゲタイプは ${type.icon} ${type.name}！`,
    "",
    type.description,
    "",
    `あなたも診断してみよう → ${resultUrl}`,
  ].join("\n")

  const handleShareX = () => {
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "width=550,height=420"
    )
  }

  const handleShareLine = () => {
    globalThis.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(resultUrl)}`,
      "_blank"
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
      >
        {copied ? "✓ コピーしました" : "🔗 コピーして共有"}
      </button>
      <button
        onClick={handleShareLine}
        className="rounded-lg bg-[#06C755] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#05b34c]"
      >
        LINE
      </button>
      <button
        onClick={handleShareX}
        className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        𝕏
      </button>
    </div>
  )
}
