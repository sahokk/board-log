import { RecentPlays } from "@/components/RecentPlays"
import { GameSearchSection } from "@/components/GameSearchSection"
import { auth } from "@/lib/auth"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen wood-texture">
      {/* ヒーローセクション */}
      <section className="border-b border-amber-200/50">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-amber-950">
            🎲 BoardLog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-amber-900/80">
            ボードゲームの思い出を記録して、アルバムのように振り返ろう
          </p>
          {!session && (
            <div className="mt-8">
              <Link
                href="/api/auth/signin"
                className="inline-block rounded-xl bg-amber-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
              >
                はじめる
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* 最近のプレイ */}
        <RecentPlays />

        {/* ゲーム検索 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-amber-950">
              ゲームを探す
            </h2>
            <p className="mt-1 text-sm text-amber-800/70">
              プレイしたゲームを記録しよう
            </p>
          </div>
          <GameSearchSection />
        </section>
      </div>
    </div>
  )
}

