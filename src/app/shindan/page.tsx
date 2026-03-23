import { Suspense } from "react"
import type { Metadata } from "next"
import { DiagnosisClient } from "./DiagnosisClient"

export const metadata: Metadata = {
  title: "ボドゲタイプ診断 | Boardory",
  description: "ログイン不要でボードゲームタイプを診断。遊んだゲームを選ぶだけで、あなたのプレイスタイルがわかります。",
}

export default function TryPage() {
  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
          </div>
        }>
          <DiagnosisClient />
        </Suspense>
      </div>
    </div>
  )
}
