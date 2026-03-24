import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const games = await prisma.game.findMany({
    where: { nameJa: { not: null } },
    select: {
      id: true,
      name: true,
      nameJa: true,
      customNameJa: true,
      imageUrl: true,
      _count: { select: { nameReports: { where: { status: "PENDING" } } } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(games)
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { gameId, customNameJa } = await request.json()

  if (!gameId || typeof gameId !== "string") {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  const game = await prisma.game.update({
    where: { id: gameId },
    data: { customNameJa: typeof customNameJa === "string" && customNameJa.trim() ? customNameJa.trim() : null },
    select: { id: true, customNameJa: true },
  })

  return NextResponse.json(game)
}
