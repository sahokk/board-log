import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { GameImage } from "@/components/GameImage"
import ReportActions from "./ReportActions"

export default async function AdminReportsPage() {
  const admin = await getAdminSession()
  if (!admin) redirect("/")

  const reports = await prisma.nameReport.findMany({
    where: { status: "PENDING" },
    include: {
      game: { select: { id: true, name: true, nameJa: true, customNameJa: true, imageUrl: true } },
      reporter: { select: { id: true, username: true, displayName: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">名称修正レポート</h1>

      {reports.length === 0 ? (
        <p className="text-gray-500">未対応のレポートはありません</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const reporterName = report.reporter.displayName ?? report.reporter.name ?? report.reporter.username ?? "Unknown"
            const currentName = report.game.customNameJa ?? report.game.nameJa ?? "（なし）"
            return (
              <div key={report.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex gap-4">
                  <div className="w-14 h-14 shrink-0">
                    <GameImage src={report.game.imageUrl ?? null} alt={report.game.name} className="w-14 h-14 rounded-lg object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{report.game.name}</p>
                    <div className="mt-1 text-sm space-y-0.5">
                      <p className="text-gray-500">
                        現在: <span className="text-gray-700">{currentName}</span>
                      </p>
                      <p className="text-amber-700 font-medium">
                        提案: {report.suggestedName}
                      </p>
                      {report.reason && (
                        <p className="text-gray-500 text-xs mt-1">{report.reason}</p>
                      )}
                      <p className="text-gray-400 text-xs">
                        報告者: {reporterName} · {new Date(report.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <ReportActions reportId={report.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
