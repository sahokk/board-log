import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gameId } = await request.json()
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  const item = await prisma.wishlistItem.upsert({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    update: {},
    create: { userId: session.user.id, gameId },
  })

  return NextResponse.json({ item })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gameId } = await request.json()
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, gameId },
  })

  return NextResponse.json({ success: true })
}
