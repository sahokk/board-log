import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET /api/wishlist - 気になるリストを取得
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entries = await prisma.wishlistEntry.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ entries })
}

// POST /api/wishlist - 気になるリストに追加
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { gameId } = body
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 })
  }

  const entry = await prisma.wishlistEntry.upsert({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    create: { userId: session.user.id, gameId },
    update: {},
    include: { game: true },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
