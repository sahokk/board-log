import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const reports = await prisma.nameReport.findMany({
    where: { status: "PENDING" },
    include: {
      game: { select: { id: true, name: true, nameJa: true, customNameJa: true, imageUrl: true } },
      reporter: { select: { id: true, username: true, displayName: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(reports)
}
