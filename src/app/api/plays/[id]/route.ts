import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

// PUT: GameEntry の評価を更新
export async function PUT(
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
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: { id, userId },
  })

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.gameEntry.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
