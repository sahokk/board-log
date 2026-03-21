import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entries = await prisma.gameEntry.findMany({
    where: { userId: session.user.id },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ entries })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
    where: { userId_gameId: { userId: session.user.id, gameId } },
    update: { rating: ratingNum },
    create: { userId: session.user.id, gameId, rating: ratingNum },
  })

  // PlaySession を追加
  const sess = await prisma.playSession.create({
    data: {
      gameEntryId: entry.id,
      playedAt: playedAt ? new Date(playedAt) : null,
      memo: memo?.trim() || null,
    },
  })

  return NextResponse.json({ entry, session: sess }, { status: 201 })
}
