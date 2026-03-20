import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE: PlaySession を削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // 自分のセッションか確認
  const playSession = await prisma.playSession.findFirst({
    where: {
      id,
      gameEntry: { userId: session.user.id },
    },
  })

  if (!playSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.playSession.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
