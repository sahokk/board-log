import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// DELETE /api/wishlist/[gameId] - 気になるリストから削除
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gameId } = await params

  await prisma.wishlistEntry.deleteMany({
    where: { userId: session.user.id, gameId },
  })

  return NextResponse.json({ success: true })
}
