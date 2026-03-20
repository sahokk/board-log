import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DeleteButton } from "./DeleteButton"
import { SessionList } from "./SessionList"

interface Props {
  readonly params: Promise<{ id: string }>
}

export default async function PlayDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/plays")
  }

  const { id } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: { id, userId: session.user.id },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  })

  if (!entry) notFound()

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-lg px-6">
        {/* 戻るリンク */}
        <Link
          href="/plays"
          className="mb-8 inline-flex items-center text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
        >
          ← プレイ履歴に戻る
        </Link>

        {/* ゲーム箱画像 */}
        <div className="wood-card relative mx-auto mb-8 h-64 w-64 overflow-hidden rounded-2xl shadow-lg">
          <div className="relative h-full bg-linear-to-br from-amber-50/30 to-amber-100/30">
            {entry.game.imageUrl ? (
              <Image
                src={entry.game.imageUrl}
                alt={entry.game.name}
                fill
                className="object-contain p-6"
                sizes="256px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-amber-300">
                <span className="text-7xl">🎲</span>
              </div>
            )}
          </div>
        </div>

        {/* ゲーム名 */}
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-amber-950">
          {entry.game.name}
        </h1>

        {/* 評価 */}
        <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800/70">評価</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= entry.rating ? "text-amber-500" : "text-amber-200/40"}
                  >
                    ★
                  </span>
                ))}
              </div>
              <Link
                href={`/plays/${entry.id}/edit`}
                className="text-xs font-medium text-amber-800/70 underline hover:text-amber-950"
              >
                変更
              </Link>
            </div>
          </div>
        </div>

        {/* プレイ記録一覧 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-950">
              プレイ記録{" "}
              <span className="text-sm font-normal text-amber-800/60">
                {entry.sessions.length}回
              </span>
            </h2>
            <Link
              href={`/record?gameId=${entry.gameId}`}
              className="rounded-lg bg-amber-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-800"
            >
              + 追加
            </Link>
          </div>

          {entry.sessions.length === 0 ? (
            <div className="wood-card rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm text-amber-800/70">まだプレイ記録がありません</p>
            </div>
          ) : (
            <SessionList
              sessions={entry.sessions.map((s) => ({
                id: s.id,
                playedAt: s.playedAt.toISOString(),
                memo: s.memo,
                imageUrl: s.imageUrl,
              }))}
            />
          )}
        </div>

        {/* ゲームを削除 */}
        <div className="mt-8">
          <DeleteButton playId={entry.id} label="このゲームの記録をすべて削除" />
        </div>
      </div>
    </div>
  )
}
