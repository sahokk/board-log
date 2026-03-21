import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

// POST: 既存GameEntryにPlaySessionを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: { id, userId },
  })

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { playedAt, memo } = body

  const playSession = await prisma.playSession.create({
    data: {
      gameEntry: { connect: { id: entry.id } },
      playedAt: playedAt ? new Date(playedAt) : null,
      memo: memo?.trim() || null,
    },
  })

  return NextResponse.json({ session: playSession }, { status: 201 })
}
