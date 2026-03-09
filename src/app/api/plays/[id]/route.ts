import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const play = await prisma.playRecord.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!play) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { playedAt, rating, memo } = body

  if (!playedAt || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const updated = await prisma.playRecord.update({
    where: { id },
    data: {
      playedAt: new Date(playedAt),
      rating,
      memo: memo || null,
    },
  })

  return NextResponse.json({ success: true, play: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const play = await prisma.playRecord.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!play) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.playRecord.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
