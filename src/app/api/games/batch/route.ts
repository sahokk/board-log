import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids")
  if (!idsParam) return NextResponse.json({ games: [] })

  const ids = idsParam.split(",").filter(Boolean).slice(0, 50)
  if (ids.length === 0) return NextResponse.json({ games: [] })

  try {
    const games = await prisma.game.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        nameJa: true,
        customNameJa: true,
        imageUrl: true,
        mechanics: true,
        categories: true,
        weight: true,
      },
    })

    // URLパラメータの順序を保持
    const gameMap = new Map(games.map((g) => [g.id, g]))
    const ordered = ids.flatMap((id) => {
      const g = gameMap.get(id)
      return g ? [g] : []
    })

    return NextResponse.json({ games: ordered })
  } catch (error) {
    console.error("Batch game fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}
