import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { translateCategory } from "@/lib/bgg/translations"
import { deduplicateMechanics } from "@/lib/bgg/mechanic-labels"
import { MechanicTag } from "@/components/MechanicTag"
import { WishlistButton } from "@/components/WishlistButton"
import type { Metadata } from "next"

interface Props {
  readonly params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const game = await prisma.game.findUnique({
    where: { id },
    select: { name: true, nameJa: true },
  })
  if (!game) return { title: "ゲームが見つかりません" }
  return { title: (game.nameJa ?? game.name) + " | Boardory" }
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const game = await prisma.game.findUnique({ where: { id } })
  if (!game) notFound()

  const session = await auth()
  const wishlisted = session?.user?.id
    ? !!(await prisma.wishlistItem.findFirst({
        where: { userId: session.user.id, gameId: id },
      }))
    : false

  const categories = game.categories
    ? game.categories.split(",").map((c) => translateCategory(c.trim())).filter(Boolean)
    : []
  const mechanics = game.mechanics ? deduplicateMechanics(game.mechanics) : []

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-xl px-6">

        <Link href="/shindan" className="mb-6 inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900">
          ← 診断に戻る
        </Link>

        <div className="wood-card mt-4 overflow-hidden rounded-2xl shadow-sm">

          {/* ヘッダー */}
          <div className="flex gap-5 p-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-amber-100/60">
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.nameJa ?? game.name}
                  fill
                  className="object-contain p-2"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-amber-300">🎲</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight text-amber-950">
                {game.nameJa ?? game.name}
              </h1>
              {game.nameJa && (
                <p className="mt-0.5 text-sm text-amber-700/60">{game.name}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-amber-800/70">
                {game.playingTime && <span>⏱ {game.playingTime}分</span>}
                {game.minPlayers != null && game.maxPlayers != null && (
                  <span>👥 {game.minPlayers}〜{game.maxPlayers}人</span>
                )}
                {game.weight != null && (
                  <span>⚖️ 重さ {game.weight.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>

          {/* カテゴリ・メカニクス */}
          {(categories.length > 0 || mechanics.length > 0) && (
            <div className="space-y-4 border-t border-amber-100 px-6 py-4">
              {categories.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-amber-800/60">カテゴリ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mechanics.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-amber-800/60">メカニクス</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mechanics.map((m) => (
                      <MechanicTag key={m} name={m} variant="outline" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-col gap-2 border-t border-amber-100 p-5">
            <Link
              href={`/record?gameId=${game.id}`}
              className="block w-full rounded-xl bg-amber-900 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-amber-800"
            >
              遊んだ！
            </Link>
            <WishlistButton gameId={game.id} initialWishlisted={wishlisted} />
            {game.bggId && (
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-amber-300 py-2.5 text-center text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
              >
                BGGで詳細を見る
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
