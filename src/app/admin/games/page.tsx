import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { GameImage } from "@/components/GameImage"
import CustomNameEditor from "./CustomNameEditor"

export default async function AdminGamesPage() {
  const admin = await getAdminSession()
  if (!admin) redirect("/")

  const games = await prisma.game.findMany({
    where: { nameJa: { not: null } },
    select: {
      id: true,
      name: true,
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 w-10"></th>
              <th className="pb-2 pr-4">英語名</th>
              <th className="pb-2 pr-4">nameJa（BGG）</th>
              <th className="pb-2 pr-4">customNameJa</th>
              <th className="pb-2 text-center">報告</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-2">
                  <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                    <GameImage src={game.imageUrl ?? null} alt={game.name} className="object-contain p-0.5" />
                  </div>
                </td>
                <td className="py-2 pr-4 text-gray-700 max-w-50 truncate">{game.name}</td>
                <td className="py-2 pr-4 text-gray-500">{game.nameJa}</td>
                <td className="py-2 pr-4">
                  <CustomNameEditor gameId={game.id} currentCustomName={game.customNameJa} />
                </td>
                <td className="py-2 text-center">
                  {game._count.nameReports > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                      {game._count.nameReports}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
