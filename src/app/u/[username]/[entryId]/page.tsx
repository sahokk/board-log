import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { translateCategory } from "@/lib/bgg/translations"
import { MechanicTag } from "@/components/MechanicTag"
import type { Metadata } from "next"

interface Props {
  readonly params: Promise<{ username: string; entryId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entryId } = await params
  const entry = await prisma.gameEntry.findUnique({
    where: { id: entryId },
    select: { game: { select: { name: true, nameJa: true } } },
  })
  if (!entry) return { title: "ゲームが見つかりません" }
  return { title: (entry.game.nameJa ?? entry.game.name) + " | BoardLog" }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default async function PublicGameDetailPage({ params }: Props) {
  const { username, entryId } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: {
      id: entryId,
      user: { username },
    },
    include: {
      game: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  })

  if (!entry) notFound()

  const { game } = entry

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-lg px-6">
        {/* 戻るリンク */}
        <Link
          href={`/u/${username}`}
          className="mb-8 inline-flex items-center text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
        >
          ← プロフィールに戻る
        </Link>

        {/* ゲーム箱画像 */}
        <div className="wood-card relative mx-auto mb-8 h-64 w-64 overflow-hidden rounded-2xl shadow-lg">
          <div className="relative h-full bg-linear-to-br from-amber-50/30 to-amber-100/30">
            {game.imageUrl ? (
              <Image
                src={game.imageUrl}
                alt={game.nameJa ?? game.name}
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
            {game.nameJa ?? game.name}
          </h1>
          {game.nameJa && (
            <p className="mt-1 text-sm text-amber-800/60">{game.name}</p>
          )}
        </div>

        {/* BGG メタデータ */}
        {(game.bggId || game.categories || game.mechanics || game.weight || game.playingTime) && (
          <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm space-y-4">
            {game.bggId && (
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline hover:text-amber-950"
              >
                BGGで詳細を見る →
              </a>
            )}
            {(game.minPlayers || game.maxPlayers || game.playingTime || game.weight) && (
              <div className="flex flex-wrap gap-4 text-sm text-amber-800/80">
                {(game.minPlayers || game.maxPlayers) && (
                  <span>
                    👥 {game.minPlayers ?? "?"}{game.maxPlayers && game.maxPlayers !== game.minPlayers ? `〜${game.maxPlayers}` : ""}人
                  </span>
                )}
                {game.playingTime && <span>⏱ {game.playingTime}分</span>}
                {game.weight && <span>⚖️ 複雑度 {game.weight.toFixed(1)} / 5</span>}
              </div>
            )}
            {game.categories && (
              <div>
                <p className="mb-2 text-xs font-medium text-amber-800/60">カテゴリ</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.categories.split(",").map((cat) => (
                    <span key={cat} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {translateCategory(cat.trim())}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {game.mechanics && (
              <div>
                <p className="mb-2 text-xs font-medium text-amber-800/60">メカニクス</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.mechanics.split(",").map((mech) => (
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
          </div>
        </div>

        {/* プレイ記録一覧 */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-amber-950">
            プレイ記録{" "}
            <span className="text-sm font-normal text-amber-800/60">
              {entry.sessions.length}回
            </span>
          </h2>
          {entry.sessions.length === 0 ? (
            <div className="wood-card rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm text-amber-800/70">まだプレイ記録がありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entry.sessions.map((session) => (
                <div key={session.id} className="wood-card rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-amber-950">
                    {formatDate(session.playedAt)}
                  </p>
                  {session.memo && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-900/80">
                      {session.memo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
