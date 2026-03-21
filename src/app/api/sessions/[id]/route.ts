import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

// PUT: PlaySession を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const playSession = await prisma.playSession.findFirst({
    where: { id, gameEntry: { userId } },
  })

  if (!playSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { playedAt, memo } = body

  const updated = await prisma.playSession.update({
    where: { id },
    data: {
      playedAt: playedAt ? new Date(playedAt) : null,
      memo: memo?.trim() || null,
    },
  })

  return NextResponse.json({ session: updated })
}

// DELETE: PlaySession を削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const playSession = await prisma.playSession.findFirst({
    where: { id, gameEntry: { userId } },
  })

  if (!playSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.playSession.delete({ where: { id } })

  // セッションがなくなったらGameEntryも削除
  const remaining = await prisma.playSession.count({
    where: { gameEntryId: playSession.gameEntryId },
  })
  if (remaining === 0) {
    await prisma.gameEntry.delete({ where: { id: playSession.gameEntryId } })
  }

  return NextResponse.json({ success: true, entryDeleted: remaining === 0 })
}
