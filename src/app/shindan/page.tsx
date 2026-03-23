import { Suspense } from "react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { DiagnosisClient } from "./DiagnosisClient"

export const metadata: Metadata = {
  title: "ボドゲタイプ診断 | Boardory",
  description: "ログイン不要でボードゲームタイプを診断。遊んだゲームを選ぶだけで、あなたのプレイスタイルがわかります。",
}

async function getPopularGames() {
  try {
    const topEntries = await prisma.gameEntry.groupBy({
      by: ["gameId"],
      _count: { gameId: true },
      orderBy: { _count: { gameId: "desc" } },
      take: 24,
    })

    if (topEntries.length === 0) return []

    const ids = topEntries.map((e) => e.gameId)
    const games = await prisma.game.findMany({
      where: { id: { in: ids }, imageUrl: { not: null } },
      select: { id: true, name: true, nameJa: true, imageUrl: true, mechanics: true, categories: true, weight: true },
    })

    const gameMap = new Map(games.map((g) => [g.id, g]))
    return ids.map((id) => gameMap.get(id)).filter((g) => g !== undefined).slice(0, 12)
  } catch {
    return []
  }
}

export default async function ShindanPage() {
  const suggestedGames = await getPopularGames()

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
          </div>
        }>
          <DiagnosisClient suggestedGames={suggestedGames} />
        </Suspense>
      </div>
    </div>
  )
}
