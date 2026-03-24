import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import AdminGamesClient from "./AdminGamesClient"

export default async function AdminGamesPage() {
  const admin = await getAdminSession()
  if (!admin) redirect("/")

  const games = await prisma.game.findMany({
    where: { nameJa: { not: null } },
    select: {
      id: true,
      name: true,
      bggId: true,
      nameJa: true,
      customNameJa: true,
      imageUrl: true,
      _count: { select: { nameReports: { where: { status: "PENDING" } } } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">ゲーム日本語名管理</h1>
      <p className="text-sm text-gray-500 mb-6">nameJaが設定されているゲーム一覧。customNameJaを直接編集できます。</p>
      <AdminGamesClient games={games} />
    </div>
  )
}
