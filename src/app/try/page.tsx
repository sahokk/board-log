import type { Metadata } from "next"
import { TryClient } from "./TryClient"

export const metadata: Metadata = {
  title: "ゲストで試す | Boardory",
  description: "ログイン不要でボドゲタイプ診断と名刺画像を作れます",
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
