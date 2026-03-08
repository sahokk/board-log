import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plays = await prisma.playRecord.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { playedAt: "desc" },
  })

  return NextResponse.json({ plays })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { gameId, playedAt, rating, memo } = body

  if (!gameId || !playedAt || rating == null) {
    return NextResponse.json(
      { error: "gameId, playedAt, rating are required" },
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

  const play = await prisma.playRecord.create({
    data: {
      userId: session.user.id,
      gameId,
      playedAt: new Date(playedAt),
      rating: ratingNum,
      memo: memo || null,
    },
    include: { game: true },
  })

  return NextResponse.json({ play }, { status: 201 })
}
