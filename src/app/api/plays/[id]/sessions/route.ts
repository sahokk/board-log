import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: 既存GameEntryにPlaySessionを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { playedAt, memo } = body

  if (!playedAt) {
    return NextResponse.json({ error: "playedAt is required" }, { status: 400 })
  }

  const playSession = await prisma.playSession.create({
    data: {
      gameEntryId: entry.id,
      playedAt: new Date(playedAt),
      memo: memo?.trim() || null,
    },
  })

  return NextResponse.json({ session: playSession }, { status: 201 })
}
