import Link from "next/link"
import { cache } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateBoardgameType } from "@/lib/boardgame-type"
import { getTypeRecommendedGames } from "@/lib/recommendations"
import { BoardgameTypeCard } from "@/components/BoardgameTypeCard"
import { TypeRecommendedGames } from "@/components/TypeRecommendedGames"
import { ResultShareButtons } from "./ResultShareButtons"
import type { Metadata } from "next"

interface Props {
  readonly searchParams: Promise<{ games?: string }>
}

const getResultData = cache(async function getResultData(gamesParam: string | undefined) {
  if (!gamesParam) return null
  const ids = gamesParam.split(",").filter(Boolean)
  if (ids.length === 0) return null

  const games = await prisma.game.findMany({
    where: { id: { in: ids } },
    select: { id: true, weight: true, categories: true, mechanics: true },
  })
  if (games.length === 0) return null

  const type = calculateBoardgameType({
    entries: games.map((g) => ({ gameId: g.id, sessionCount: 1 })),
    games: games.map((g) => ({
      gameId: g.id,
      weight: g.weight ?? null,
      categories: g.categories ?? null,
      mechanics: g.mechanics ?? null,
    })),
  })

  return type
})

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { games } = await searchParams
  const type = await getResultData(games)
  if (!type) return { title: "ボドゲタイプ診断結果 | Boardory" }

  const title = `私のボドゲタイプは ${type.icon} ${type.name}！`
  return {
    title: `${type.icon} ${type.name} | Boardory診断`,
    description: type.description,
    openGraph: {
      title,
      description: type.description + "\n\nあなたのタイプも診断してみよう 🎲",
    },
    twitter: {
      card: "summary",
      title,
      description: type.description,
    },
  }
}

export default async function ResultPage({ searchParams }: Props) {
  const { games } = await searchParams
  const type = await getResultData(games)

  if (!type) notFound()

  const recommendations = await getTypeRecommendedGames(type.id)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://boardory.pekori.dev"
  const resultUrl = `${baseUrl}/shindan/result?games=${games}`

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">

        <div className="mb-6">
          <Link href="/shindan" className="text-sm text-amber-700 hover:text-amber-900">
            ← 診断をやり直す
          </Link>
        </div>

        <div className="mb-8 text-center">
          <p className="mb-3 text-4xl">🎲</p>
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">診断結果</h1>
        </div>

        <div className="space-y-4">
          <BoardgameTypeCard type={type} />

          <ResultShareButtons type={type} resultUrl={resultUrl} />

          {recommendations.length > 0 && (
            <TypeRecommendedGames games={recommendations} />
          )}

          {/* ログインCTA */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-center">
            <p className="text-sm font-medium text-amber-950">記録を残して本格診断しよう</p>
            <p className="mt-1 text-xs text-amber-800/70">
              ゲームを登録すると、プレイ回数が反映されてより精度の高い診断になります
            </p>
            <Link
              href="/api/auth/signin"
              className="mt-3 inline-block rounded-lg bg-amber-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800"
            >
              ログインして始める
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
