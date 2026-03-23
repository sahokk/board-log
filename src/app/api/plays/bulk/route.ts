import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const { gameIds } = body

  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return NextResponse.json({ error: "gameIds is required" }, { status: 400 })
  }

  const ids = gameIds.filter((id): id is string => typeof id === "string").slice(0, 50)

  let count = 0
  await prisma.$transaction(async (tx) => {
    for (const gameId of ids) {
      const existing = await tx.gameEntry.findFirst({ where: { userId, gameId } })
      if (!existing) {
        const entry = await tx.gameEntry.create({
          data: { userId, gameId, rating: 0 },
        })
        await tx.playSession.create({
          data: { gameEntryId: entry.id, playedAt: null },
        })
        count++
      }
    }
  })

  return NextResponse.json({ count }, { status: 201 })
}
