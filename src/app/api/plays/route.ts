import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const entries = await prisma.gameEntry.findMany({
    where: { userId },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ entries })
}

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const { gameId, rating, playedAt, memo } = body

  if (!gameId || rating == null) {
    return NextResponse.json(
      { error: "gameId and rating are required" },
      { status: 400 }
    )
  }

  const ratingNum = Number(rating)
  if (ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { error: "rating must be 1-5" },
      { status: 400 }
    )
  }

  // GameEntry を upsert（評価は最新のものに更新）
  const entry = await prisma.gameEntry.upsert({
    where: { userId_gameId: { userId, gameId } },
    update: { rating: ratingNum },
    create: { userId, gameId, rating: ratingNum },
  })

  // PlaySession を追加
  const sess = await prisma.playSession.create({
    data: {
      gameEntry: { connect: { id: entry.id } },
      playedAt: playedAt ? new Date(playedAt) : null,
      memo: memo?.trim() || null,
    },
  })

  return NextResponse.json({ entry, session: sess }, { status: 201 })
}
