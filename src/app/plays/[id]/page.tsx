import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DeleteButton } from "./DeleteButton"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/plays")
  }

  const { id } = await params

  const play = await prisma.playRecord.findFirst({
    where: { id, userId: session.user.id },
    include: { game: true },
  })

  if (!play) notFound()

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
            {play.game.imageUrl ? (
              <Image
                src={play.game.imageUrl}
                alt={play.game.name}
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
          {play.game.name}
        </h1>

        {/* 詳細情報 */}
        <div className="wood-card space-y-6 rounded-2xl p-6 shadow-sm">
          {/* プレイ日 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800/70">プレイ日</span>
            <span className="text-sm font-semibold text-amber-950">
              {formatDate(play.playedAt)}
            </span>
          </div>

          {/* 評価 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800/70">評価</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= play.rating ? "text-amber-500" : "text-amber-200/40"}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm font-medium text-amber-800/70">{play.rating}/5</span>
            </div>
          </div>

          {/* メモ */}
          {play.memo && (
            <div>
              <p className="mb-2 text-sm font-medium text-amber-800/70">メモ</p>
              <p className="whitespace-pre-wrap rounded-xl bg-amber-50/40 p-4 text-sm leading-relaxed text-amber-900">
                {play.memo}
              </p>
            </div>
          )}

          {/* 記録日時 */}
          <div className="border-t border-amber-200/50 pt-4">
            <p className="text-xs text-amber-700/60">
              記録日:{" "}
              {new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(play.createdAt)}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/plays/${play.id}/edit`}
            className="wood-card flex-1 rounded-xl px-6 py-3 text-center text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 hover:shadow-md"
          >
            編集
          </Link>
          <div className="flex-1">
            <DeleteButton playId={play.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
