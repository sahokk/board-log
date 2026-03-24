import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { gameId, suggestedName, reason } = body

  if (!gameId || typeof gameId !== "string") {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }
  if (!suggestedName || typeof suggestedName !== "string" || !suggestedName.trim()) {
    return NextResponse.json({ error: "suggestedName is required" }, { status: 400 })
  }

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } })
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  const report = await prisma.nameReport.create({
    data: {
      gameId,
      reporterId: session.user.id,
      suggestedName: suggestedName.trim(),
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    },
  })

  return NextResponse.json({ id: report.id }, { status: 201 })
}
