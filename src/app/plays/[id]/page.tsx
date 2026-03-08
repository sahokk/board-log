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
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* 戻るリンク */}
      <Link
        href="/plays"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← プレイ履歴に戻る
      </Link>

      {/* ゲーム箱画像 */}
      <div className="relative mx-auto mb-6 h-48 w-48 overflow-hidden rounded-lg bg-gray-100">
        {play.game.imageUrl ? (
          <Image
            src={play.game.imageUrl}
            alt={play.game.name}
            fill
            className="object-contain p-4"
            sizes="192px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <span className="text-6xl">🎲</span>
          </div>
        )}
      </div>

      {/* ゲーム名 */}
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {play.game.name}
      </h1>

      {/* 詳細情報 */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {/* プレイ日 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">プレイ日</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(play.playedAt)}
          </span>
        </div>

        {/* 評価 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">評価</span>
          <span>
            <span className="text-xl text-yellow-400">
              {"★".repeat(play.rating)}
            </span>
            <span className="text-xl text-gray-300">
              {"★".repeat(5 - play.rating)}
            </span>
            <span className="ml-1 text-sm text-gray-500">{play.rating}/5</span>
          </span>
        </div>

        {/* メモ */}
        {play.memo && (
          <div>
            <p className="mb-2 text-sm text-gray-500">メモ</p>
            <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
              {play.memo}
            </p>
          </div>
        )}

        {/* 記録日時 */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">
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

      {/* 削除ボタン */}
      <div className="mt-6 text-center">
        <DeleteButton playId={play.id} />
      </div>
    </div>
  )
}
