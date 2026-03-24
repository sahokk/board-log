import { redirect } from "next/navigation"
import Link from "next/link"
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">ゲーム日本語名管理</h1>
        <Link href="/admin/reports" className="text-sm text-amber-600 hover:underline">← レポート一覧</Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">nameJaが設定されているゲーム一覧。customNameJaを直接編集できます。</p>
      <AdminGamesClient games={games} />
    </div>
  )
}
