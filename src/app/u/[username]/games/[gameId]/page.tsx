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
  readonly params: Promise<{ username: string; gameId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameId } = await params
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { name: true, nameJa: true },
  })
  if (!game) return { title: "ゲームが見つかりません" }
  return { title: (game.nameJa ?? game.name) + " | Boardory" }
}

export default async function PublicGamePage({ params }: Props) {
  const { username, gameId } = await params

  // ユーザーの存在確認
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })
  if (!user) notFound()

  const game = await prisma.game.findUnique({ where: { id: gameId } })
  if (!game) notFound()

  // ログイン中ならウィッシュリスト状態を確認
  const session = await auth()
  const wishlisted = session?.user?.id
    ? (await prisma.wishlistItem.findUnique({
        where: { userId_gameId: { userId: session.user.id, gameId: game.id } },
      })) !== null
    : false

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
                alt={game.customNameJa ?? game.nameJa ?? game.name}
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
            {game.customNameJa ?? game.nameJa ?? game.name}
          </h1>
          {(game.customNameJa || game.nameJa) && (
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
                  {game.categories.split(",").map((cat) => {
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
            {game.mechanics && (
              <div>
                <p className="mb-2 text-xs font-medium text-amber-800/60">メカニクス</p>
                <div className="flex flex-wrap gap-1.5">
                  {deduplicateMechanics(game.mechanics).map((mech) => (
                    <MechanicTag key={mech} name={mech} variant="outline" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* アクション */}
        {session?.user?.id && (
          <div className="mb-6 flex flex-col gap-3">
            <Link
              href={`/record?gameId=${game.id}`}
              className="block w-full rounded-xl bg-amber-900 py-3 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
            >
              遊んだ！
            </Link>
            <WishlistButton gameId={game.id} initialWishlisted={wishlisted} />
          </div>
        )}
      </div>
    </div>
  )
}
