import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { gameId } = await request.json()
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  const item = await prisma.wishlistItem.upsert({
    where: { userId_gameId: { userId, gameId } },
    update: {},
    create: { userId, gameId },
  })

  return NextResponse.json({ item })
}

export async function DELETE(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { gameId } = await request.json()
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  await prisma.wishlistItem.deleteMany({
    where: { userId, gameId },
  })

  return NextResponse.json({ success: true })
}
