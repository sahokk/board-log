import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT: GameEntry の評価を更新
export async function PUT(
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
  const { rating } = body

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 })
  }

  const updated = await prisma.gameEntry.update({
    where: { id },
    data: { rating },
  })

  return NextResponse.json({ success: true, entry: updated })
}

// DELETE: GameEntry を削除（PlaySession は cascade で削除）
export async function DELETE(
  _request: NextRequest,
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

  await prisma.gameEntry.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
