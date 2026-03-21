import { prisma } from "@/lib/prisma"

/**
 * ユーザーの全ゲームエントリを取得（全セッション含む）
 * プロフィールページ・統計計算用
 */
export async function getUserGameEntries(userId: string) {
  return prisma.gameEntry.findMany({
    where: { userId },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  })
}

/**
 * ユーザーの全ゲームエントリを取得（最新セッション1件 + セッション数カウント）
 * プレイ履歴一覧・公開プロフィール用
 */
export async function getUserGameEntriesWithLatest(userId: string) {
  return prisma.gameEntry.findMany({
    where: { userId },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
}
