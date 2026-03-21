import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { translateCategory } from "@/lib/bgg/translations"
import { MechanicTag } from "@/components/MechanicTag"
import { DeleteButton } from "./DeleteButton"
import { SessionList } from "./SessionList"
import { RatingEditor } from "./RatingEditor"

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
          ← 遊んだゲームリストに戻る
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">
            {entry.game.nameJa ?? entry.game.name}
          </h1>
          {entry.game.nameJa && (
            <p className="mt-1 text-sm text-amber-800/60">{entry.game.name}</p>
          )}
        </div>

        {/* BGG メタデータ */}
        {(entry.game.bggId || entry.game.categories || entry.game.mechanics || entry.game.weight || entry.game.playingTime) && (
          <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm space-y-4">
            {entry.game.bggId && (
              <a
                href={`https://boardgamegeek.com/boardgame/${entry.game.bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline hover:text-amber-950"
              >
                BGGで詳細を見る →
              </a>
            )}
            {(entry.game.minPlayers || entry.game.maxPlayers || entry.game.playingTime) && (
              <div className="flex flex-wrap gap-4 text-sm text-amber-800/80">
                {(entry.game.minPlayers || entry.game.maxPlayers) && (
                  <span>
                    👥 {entry.game.minPlayers ?? "?"}{entry.game.maxPlayers && entry.game.maxPlayers !== entry.game.minPlayers ? `〜${entry.game.maxPlayers}` : ""}人
                  </span>
                )}
                {entry.game.playingTime && (
                  <span>⏱ {entry.game.playingTime}分</span>
                )}
                {entry.game.weight && (
                  <span>⚖️ 複雑度 {entry.game.weight.toFixed(1)} / 5</span>
                )}
              </div>
            )}
            {entry.game.categories && (
              <div>
                <p className="mb-2 text-xs font-medium text-amber-800/60">カテゴリ</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.game.categories.split(",").map((cat) => {
                    const label = translateCategory(cat.trim())
                    if (!label) return null
                    return (
                      <span key={cat} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {entry.game.mechanics && (
              <div>
                <p className="mb-2 text-xs font-medium text-amber-800/60">メカニクス</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.game.mechanics.split(",").map((mech) => (
                    <MechanicTag key={mech} name={mech.trim()} variant="outline" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 評価 */}
        <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800/70">評価</span>
            <RatingEditor entryId={entry.id} initialRating={entry.rating} />
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
                playedAt: s.playedAt?.toISOString() ?? null,
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
