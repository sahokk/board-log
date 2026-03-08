import { NextRequest, NextResponse } from "next/server"
import { searchBggGames, getBggGameDetails } from "@/lib/bgg/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  if (!query || query.trim() === "") {
    return NextResponse.json({ error: "q is required" }, { status: 400 })
  }

  try {
    // BGG検索で上位10件のID・名前を取得
    const searchResults = await searchBggGames(query.trim())
    if (searchResults.length === 0) {
      return NextResponse.json({ games: [] })
    }

    const ids = searchResults.slice(0, 10).map((r) => r.id)

    // 画像URL等の詳細を一括取得
    const details = await getBggGameDetails(ids)

    // DBにキャッシュ（upsert）
    await Promise.all(
      details.map((game) =>
        prisma.game.upsert({
          where: { id: game.id },
          update: {
            name: game.name,
            imageUrl: game.imageUrl ?? null,
          },
          create: {
            id: game.id,
            name: game.name,
            imageUrl: game.imageUrl ?? null,
          },
        })
      )
    )

    return NextResponse.json({ games: details })
  } catch (error) {
    console.error("Game search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
