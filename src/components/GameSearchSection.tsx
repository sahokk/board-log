"use client"

import { useState } from "react"
import { SearchClient } from "@/components/SearchClient"
import { ManualGameForm } from "@/components/ManualGameForm"

export function GameSearchSection() {
  const [showManualForm, setShowManualForm] = useState(false)

  if (showManualForm) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold text-amber-950">ゲームを手動で追加</h2>
        <div className="wood-card rounded-2xl p-6 shadow-sm">
          <ManualGameForm onCancel={() => setShowManualForm(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="wood-card relative overflow-hidden rounded-2xl p-8 shadow-sm">
      {/* 準備中オーバーレイ */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-amber-50/80 backdrop-blur-[2px]">
        <p className="mb-2 text-lg font-bold text-amber-950">
          準備中
        </p>
        <p className="mb-5 max-w-sm text-center text-sm text-amber-800">
          ゲーム検索機能は現在準備中です。
          <br />
          手動でゲームを追加してプレイを記録できます。
        </p>
        <button
          onClick={() => setShowManualForm(true)}
          className="rounded-xl bg-amber-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
        >
          ゲームを手動で追加
        </button>
      </div>

      {/* 背景にうっすら検索UIを表示 */}
      <div className="pointer-events-none select-none opacity-30" aria-hidden="true">
        <SearchClient />
      </div>
    </div>
  )
}
