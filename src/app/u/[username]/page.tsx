import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getDisplayName, getProfileImage, parseFavoriteGenres } from "@/lib/profile-utils"
import { calculateTitles } from "@/lib/titles"
import { calculateBoardgameType } from "@/lib/boardgame-type"
import { translateMechanic } from "@/lib/bgg/translations"
import { GameImage } from "@/components/GameImage"
import { TitleBadges } from "@/components/TitleBadges"
import { MechanicTag } from "@/components/MechanicTag"
import { BoardgameTypeCard } from "@/components/BoardgameTypeCard"
import type { Metadata } from "next"

interface Props {
  readonly params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true, name: true },
  })
  if (!user) return { title: "ユーザーが見つかりません" }
  const displayName = getDisplayName(user)
  return {
    title: `${displayName}のボードゲームプロフィール | Boardory`,
    description: `${displayName}さんのボードゲーム記録`,
  }
}

function tagClass(i: number): string {
  if (i === 0) return "bg-amber-700 text-white"
  if (i < 3) return "bg-amber-200 text-amber-900"
  return "bg-amber-100/70 text-amber-800"
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      isProfilePublic: true,
      displayName: true,
      name: true,
      customImageUrl: true,
      image: true,
      favoriteGenres: true,
      gameEntries: {
        include: {
          game: {
            select: {
              id: true,
              name: true,
              nameJa: true,
              imageUrl: true,
              categories: true,
              mechanics: true,
              weight: true,
            },
          },
          sessions: { orderBy: { playedAt: "desc" }, take: 1 },
          _count: { select: { sessions: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      wishlistItems: {
        include: { game: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) notFound()
  if (!user.isProfilePublic) notFound()

  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  const entries = user.gameEntries
  const uniqueGames = entries.length
  const totalSessions = entries.reduce((sum, e) => sum + e._count.sessions, 0)

  // メカニクス統計
  const mechanicMap = new Map<string, { count: number; nameEn: string }>()
  entries.forEach((e) => {
    if (e.game.mechanics) {
      e.game.mechanics.split(",").forEach((mech) => {
        const en = mech.trim()
        const ja = translateMechanic(en)
        if (!ja) return
        const existing = mechanicMap.get(ja)
        mechanicMap.set(ja, { count: (existing?.count ?? 0) + 1, nameEn: en })
      })
    }
  })
  const topMechanics = Array.from(mechanicMap, ([name, { count, nameEn }]) => ({ name, nameEn, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // 称号
  const allSessions = entries.flatMap((e) =>
    e.sessions.map((s) => ({ ...s, gameId: e.gameId }))
  )
  const titles = calculateTitles({
    entries: entries.map((e) => ({ gameId: e.gameId, rating: e.rating })),
    sessions: allSessions.flatMap((s) => s.playedAt ? [{ playedAt: s.playedAt, gameId: s.gameId }] : []),
    games: entries.map((e) => ({ categories: e.game.categories, mechanics: e.game.mechanics })),
    wishlistCount: user.wishlistItems.length,
  })

  // ボドゲタイプ
  const boardgameType = calculateBoardgameType({
    entries: entries.map((e) => ({ gameId: e.gameId, sessionCount: e._count.sessions })),
    games: entries.map((e) => ({
      gameId: e.gameId,
      weight: e.game.weight,
      categories: e.game.categories,
      mechanics: e.game.mechanics,
    })),
  })

  const shareText = encodeURIComponent(displayName + "のボードゲームプロフィール🎲")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://boardory.pekori.dev"
  const shareUrl = encodeURIComponent(`${baseUrl}/u/${username}`)

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">

        {/* Profile Header */}
        <div className="wood-card mb-8 overflow-hidden rounded-2xl shadow-sm">
          {/* Top accent */}
          <div className="h-1.5 bg-linear-to-r from-amber-700 via-amber-500 to-amber-300" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: avatar + identity */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-amber-100/50 to-amber-200/50 shadow-lg ring-4 ring-amber-200/60">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl sm:text-4xl text-amber-400">
                      👤
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-950">
                    {displayName}
                  </h1>
                  <p className="mt-0.5 text-sm font-medium text-amber-700/60">@{username}</p>
                  {genres.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <a
                      href={"https://x.com/intent/tweet?text=" + shareText + "&url=" + shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      シェア
                    </a>
                  </div>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center justify-center gap-8 sm:flex-col sm:items-end sm:justify-start sm:gap-5 sm:shrink-0 border-t sm:border-t-0 sm:border-l border-amber-200/60 pt-5 sm:pt-0 sm:pl-8">
                <div className="text-center sm:text-right">
                  <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-amber-950">
                    {totalSessions}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-amber-700/70">総プレイ数</p>
                </div>
                <div className="h-8 w-px sm:h-px sm:w-12 bg-amber-200/60" />
                <div className="text-center sm:text-right">
                  <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-amber-950">
                    {uniqueGames}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-amber-700/70">ゲーム種類</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boardgame Type */}
        <div className="mb-8">
          <BoardgameTypeCard type={boardgameType} />
        </div>

        {/* 称号 */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">称号</h2>
          <TitleBadges titles={titles} />
        </div>

        {/* メカニクス */}
        {topMechanics.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-amber-950">よく遊ぶメカニクス</h2>
            <div className="wood-card rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {topMechanics.map(({ name, nameEn, count }, i) => (
                  <span key={name} className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium " + tagClass(i)}>
                    <MechanicTag name={nameEn ?? name} variant="bare" />
                    <span className={"text-xs " + (i === 0 ? "text-amber-200" : "text-amber-600")}>
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 気になるリスト */}
        {user.wishlistItems.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
              {"気になるリスト"}<span className="ml-2 text-base font-normal text-amber-800/60">{user.wishlistItems.length}タイトル</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {user.wishlistItems.map(({ game }) => (
                <Link
                  key={game.id}
                  href={`/u/${username}/games/${game.id}`}
                  className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                    <GameImage
                      src={game.imageUrl}
                      alt={game.nameJa ?? game.name}
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold text-amber-950">
                      {game.nameJa ?? game.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 遊んだゲームリスト */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
            {"遊んだゲームリスト"}<span className="ml-2 text-base font-normal text-amber-800/60">{uniqueGames}タイトル</span>
          </h2>
          {entries.length === 0 ? (
            <div className="wood-card rounded-2xl p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">🎲</div>
              <p className="text-lg font-medium text-amber-900">まだプレイ記録がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {entries.map((entry) => {
                return (
                  <Link
                    key={entry.id}
                    href={`/u/${username}/${entry.id}`}
                    className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                      <GameImage
                        src={entry.game.imageUrl}
                        alt={entry.game.nameJa ?? entry.game.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                      />
                    </div>
                    <div className="p-3">
                      <p className="mb-1.5 line-clamp-2 text-xs font-semibold text-amber-950">
                        {entry.game.nameJa ?? entry.game.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={star <= entry.rating ? "text-amber-500 text-xs" : "text-amber-200/40 text-xs"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-amber-700/50">{entry._count.sessions}回</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
