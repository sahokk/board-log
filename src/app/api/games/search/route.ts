import { NextRequest, NextResponse } from "next/server"
import { searchBggGames, getBggGameDetails } from "@/lib/bgg/client"
import { prisma } from "@/lib/prisma"

interface GameResult {
  id: string
  bggId: string | null
  name: string
  nameJa: string | null
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
  mechanics?: string | null
  categories?: string | null
  weight?: number | null
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  if (!query || query.trim() === "") {
    return NextResponse.json({ error: "q is required" }, { status: 400 })
  }

  const trimmed = query.trim()
  const offset = Math.max(0, Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10))

  try {
    // 1. ローカルDB検索（offset=0のみ）
    const localGames = offset === 0
      ? await prisma.game.findMany({
          where: { name: { contains: trimmed, mode: "insensitive" } },
          take: 20,
        })
      : []

    const localResults: GameResult[] = localGames.map((g) => ({
      id: g.id,
      bggId: g.bggId,
      name: g.name,
      nameJa: g.nameJa,
      imageUrl: g.imageUrl ?? undefined,
      mechanics: g.mechanics,
      categories: g.categories,
      weight: g.weight,
    }))

    // 2. BGG検索（graceful fallback）
    let bggResults: GameResult[] = []
    let bggTotal = 0
    try {
      const searchResults = await searchBggGames(trimmed)
      bggTotal = searchResults.length
      if (searchResults.length > offset) {
        const ids = searchResults.slice(offset, offset + 20).map((r) => r.id)
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
          nameJa: g.nameJa,
          yearPublished: details[i].yearPublished,
          imageUrl: g.imageUrl ?? undefined,
          thumbnailUrl: details[i].thumbnailUrl,
          mechanics: g.mechanics,
          categories: g.categories,
          weight: g.weight,
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

    return NextResponse.json({ games: merged, bggTotal, bggOffset: offset })
  } catch (error) {
    console.error("Game search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
