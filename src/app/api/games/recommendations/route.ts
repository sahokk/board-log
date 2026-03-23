import { NextRequest, NextResponse } from "next/server"
import { getTypeRecommendedGames } from "@/lib/recommendations"

export async function GET(request: NextRequest) {
  const typeId = request.nextUrl.searchParams.get("type")
  if (!typeId) return NextResponse.json({ games: [] })

  try {
    const games = await getTypeRecommendedGames(typeId)
    return NextResponse.json({ games })
  } catch (error) {
    console.error("Recommendations fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}
