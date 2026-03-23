import type { Metadata } from "next"
import { TryClient } from "./TryClient"

export const metadata: Metadata = {
  title: "ボドゲタイプ診断 | Boardory",
  description: "ログイン不要でボードゲームタイプを診断。遊んだゲームを選ぶだけで、あなたのプレイスタイルがわかります。",
}

export default function TryPage() {
  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">
        <TryClient />
      </div>
    </div>
  )
}
