import { NextRequest, NextResponse } from "next/server"
import { searchBggGames, getBggGameDetails } from "@/lib/bgg/client"
import { prisma } from "@/lib/prisma"

interface GameResult {
  id: string
  bggId: string | null
  name: string
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  if (!query || query.trim() === "") {
    return NextResponse.json({ error: "q is required" }, { status: 400 })
  }

  const trimmed = query.trim()

  try {
    // 1. ローカルDB検索
    const localGames = await prisma.game.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      take: 10,
    })

    const localResults: GameResult[] = localGames.map((g) => ({
      id: g.id,
      bggId: g.bggId,
      name: g.name,
      imageUrl: g.imageUrl ?? undefined,
    }))

    // 2. BGG検索（graceful fallback）
    let bggResults: GameResult[] = []
    try {
      const searchResults = await searchBggGames(trimmed)
      if (searchResults.length > 0) {
        const ids = searchResults.slice(0, 10).map((r) => r.id)
        const details = await getBggGameDetails(ids)

        const upserted = await Promise.all(
          details.map((game) =>
            prisma.game.upsert({
              where: { bggId: game.id },
              update: {
                name: game.name,
                nameJa: game.nameJa ?? null,
                imageUrl: game.imageUrl ?? null,
                categories: game.categories.length > 0 ? game.categories.join(",") : null,
                mechanics: game.mechanics.length > 0 ? game.mechanics.join(",") : null,
                weight: game.weight ?? null,
                playingTime: game.playingTime ?? null,
                minPlayers: game.minPlayers ?? null,
                maxPlayers: game.maxPlayers ?? null,
              },
              create: {
                bggId: game.id,
                name: game.name,
                nameJa: game.nameJa ?? null,
                imageUrl: game.imageUrl ?? null,
                categories: game.categories.length > 0 ? game.categories.join(",") : null,
                mechanics: game.mechanics.length > 0 ? game.mechanics.join(",") : null,
                weight: game.weight ?? null,
                playingTime: game.playingTime ?? null,
                minPlayers: game.minPlayers ?? null,
                maxPlayers: game.maxPlayers ?? null,
              },
            })
          )
        )

        bggResults = upserted.map((g, i) => ({
          id: g.id,
          bggId: g.bggId,
          name: g.name,
          yearPublished: details[i].yearPublished,
          imageUrl: g.imageUrl ?? undefined,
          thumbnailUrl: details[i].thumbnailUrl,
        }))
      }
    } catch (bggError) {
      console.warn("BGG API unavailable:", bggError)
    }

    // 3. マージ（ローカル優先、重複除去）
    const seenIds = new Set(localResults.map((g) => g.id))
    const merged = [...localResults]
    for (const game of bggResults) {
      if (!seenIds.has(game.id)) {
        merged.push(game)
        seenIds.add(game.id)
      }
    }

    return NextResponse.json({ games: merged })
  } catch (error) {
    console.error("Game search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
