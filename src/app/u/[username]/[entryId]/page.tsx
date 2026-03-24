import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { translateCategory } from "@/lib/bgg/translations"
import { deduplicateMechanics } from "@/lib/bgg/mechanic-labels"
import { MechanicTag } from "@/components/MechanicTag"
import { WishlistButton } from "@/components/WishlistButton"
import { RatingEditor } from "@/components/RatingEditor"
import { SessionList } from "@/components/SessionList"
import { DeleteButton } from "@/components/DeleteButton"
import type { Metadata } from "next"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar as faStarSolid, faUsers, faClock, faScaleBalanced, faDiceD6 } from "@fortawesome/free-solid-svg-icons"
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons"

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
  return { title: (entry.game.nameJa ?? entry.game.name) + " | Boardory" }
}

function formatDate(date: Date | null): string {
  if (!date) return "日付未設定"
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
      sessions: {
        orderBy: { playedAt: "desc" },
        select: { id: true, playedAt: true, memo: true, imageUrl: true },
      },
    },
  })

  if (!entry) notFound()

  const { game } = entry

  const session = await auth()
  const isOwner = session?.user?.id === entry.userId
  const wishlisted = !isOwner && session?.user?.id
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
                alt={game.nameJa ?? game.name}
                fill
                className="object-contain p-6"
                sizes="256px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FontAwesomeIcon icon={faDiceD6} className="size-16 text-amber-300" />
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
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUsers} className="size-3.5" />
                    {game.minPlayers ?? "?"}{game.maxPlayers && game.maxPlayers !== game.minPlayers ? `〜${game.maxPlayers}` : ""}人
                  </span>
                )}
                {game.playingTime && (
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="size-3.5" />
                    {game.playingTime}分
                  </span>
                )}
                {game.weight && (
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faScaleBalanced} className="size-3.5" />
                    複雑度 {game.weight.toFixed(1)} / 5
                  </span>
                )}
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

        {/* 評価 */}
        <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800/70">評価</span>
            {isOwner ? (
              <RatingEditor entryId={entry.id} initialRating={entry.rating} />
            ) : (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesomeIcon
                    key={star}
                    icon={star <= entry.rating ? faStarSolid : faStarRegular}
                    className={star <= entry.rating ? "text-amber-500" : "text-amber-200/40"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* オーナー以外のアクション */}
        {!isOwner && session?.user?.id && (
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

        {/* プレイ記録一覧 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-950">
              プレイ記録{" "}
              <span className="text-sm font-normal text-amber-800/60">
                {entry.sessions.length}回
              </span>
            </h2>
            {isOwner && (
              <Link
                href={`/record?gameId=${game.id}`}
                className="rounded-lg bg-amber-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-800"
              >
                + 追加
              </Link>
            )}
          </div>

          {entry.sessions.length === 0 && (
            <div className="wood-card rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm text-amber-800/70">まだプレイ記録がありません</p>
            </div>
          )}
          {entry.sessions.length > 0 && isOwner && (
            <SessionList
              sessions={entry.sessions.map((s) => ({
                id: s.id,
                playedAt: s.playedAt?.toISOString() ?? null,
                memo: s.memo,
                imageUrl: s.imageUrl,
              }))}
              emptyRedirectPath={`/u/${username}`}
            />
          )}
          {entry.sessions.length > 0 && !isOwner && session?.user?.id && (
            <div className="space-y-3">
              {entry.sessions.map((s) => (
                <div key={s.id} className="wood-card rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-amber-950">
                    {formatDate(s.playedAt)}
                  </p>
                  {s.memo && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-900/80">
                      {s.memo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* オーナーのみ：記録全削除 */}
        {isOwner && (
          <div className="mt-8">
            <DeleteButton
              playId={entry.id}
              label="このゲームの記録をすべて削除"
              redirectTo={`/u/${username}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
