import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin"

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { action } = await request.json()

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 })
  }

  const report = await prisma.nameReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (report.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 })
  }

  if (action === "approve") {
    await prisma.$transaction([
      // ゲームの日本語名を更新
      prisma.game.update({
        where: { id: report.gameId },
        data: { customNameJa: report.suggestedName },
        select: { id: true },
      }),
      // このレポートを承認
      prisma.nameReport.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: admin.userId },
      }),
      // 同じゲーム・同じ提案名のレポートも承認
      prisma.nameReport.updateMany({
        where: {
          gameId: report.gameId,
          status: "PENDING",
          suggestedName: report.suggestedName,
          id: { not: id },
        },
        data: { status: "APPROVED", reviewedById: admin.userId },
      }),
      // 残りの未対応レポートは却下
      prisma.nameReport.updateMany({
        where: {
          gameId: report.gameId,
          status: "PENDING",
          suggestedName: { not: report.suggestedName },
        },
        data: { status: "REJECTED", reviewedById: admin.userId },
      }),
    ])
  } else {
    await prisma.nameReport.update({
      where: { id },
      data: { status: "REJECTED", reviewedById: admin.userId },
    })
  }

  return NextResponse.json({ ok: true, customNameJa: action === "approve" ? report.suggestedName : undefined })
}
