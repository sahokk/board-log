import { NextRequest, NextResponse } from "next/server"
import { searchBggGames, getBggGameDetails } from "@/lib/bgg/client"
import { prisma } from "@/lib/prisma"

interface GameResult {
  id: string
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
    // 1. Search local DB first
    const localGames = await prisma.game.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      take: 10,
    })

    const localResults: GameResult[] = localGames.map((g) => ({
      id: g.id,
      name: g.name,
      imageUrl: g.imageUrl ?? undefined,
    }))

    // 2. Try BGG search (graceful fallback)
    let bggResults: GameResult[] = []
    try {
      const searchResults = await searchBggGames(trimmed)
      if (searchResults.length > 0) {
        const ids = searchResults.slice(0, 10).map((r) => r.id)
        const details = await getBggGameDetails(ids)

        // Upsert BGG results using bggId
        const upserted = await Promise.all(
          details.map((game) =>
            prisma.game.upsert({
              where: { bggId: game.id },
              update: {
                name: game.name,
                imageUrl: game.imageUrl ?? null,
              },
              create: {
                bggId: game.id,
                name: game.name,
                imageUrl: game.imageUrl ?? null,
              },
            })
          )
        )

        bggResults = upserted.map((g, i) => ({
          id: g.id,
          name: g.name,
          yearPublished: details[i].yearPublished,
          imageUrl: g.imageUrl ?? undefined,
          thumbnailUrl: details[i].thumbnailUrl,
        }))
      }
    } catch (bggError) {
      console.warn("BGG API unavailable:", bggError)
    }

    // 3. Merge: local results first, then BGG results (deduplicate by id)
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
