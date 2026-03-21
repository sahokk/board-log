import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getDisplayName, getProfileImage, parseFavoriteGenres } from "@/lib/profile-utils"
import { calculateTitles } from "@/lib/titles"
import { translateCategory, translateMechanic } from "@/lib/bgg/translations"
import { TitleBadges } from "@/components/TitleBadges"
import { MechanicTag } from "@/components/MechanicTag"
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
    title: `${displayName}のボードゲームプロフィール | BoardLog`,
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
      displayName: true,
      name: true,
      customImageUrl: true,
      image: true,
      favoriteGenres: true,
      gameEntries: {
        include: {
          game: true,
          sessions: { orderBy: { playedAt: "desc" }, take: 1 },
          _count: { select: { sessions: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!user) notFound()

  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  const entries = user.gameEntries
  const totalPlays = entries.reduce((sum, e) => sum + e._count.sessions, 0)
  const allSessions = entries.flatMap((e) =>
    e.sessions.map((s) => ({ ...s, gameId: e.gameId }))
  )
  const uniqueGames = entries.length
  const averageRating =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
      : "0"

  const favoriteGames = entries
    .filter((e) => e.rating === 5)
    .slice(0, 5)
    .map((e) => e.game)

  // カテゴリ統計
  const categoryMap = new Map<string, number>()
  entries.forEach((e) => {
    if (e.game.categories) {
      e.game.categories.split(",").forEach((cat) => {
        const t = translateCategory(cat.trim())
        if (t) categoryMap.set(t, (categoryMap.get(t) ?? 0) + 1)
      })
    }
  })
  const topCategories = Array.from(categoryMap, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // メカニクス統計
  const mechanicMap = new Map<string, { count: number; nameEn: string }>()
  entries.forEach((e) => {
    if (e.game.mechanics) {
      e.game.mechanics.split(",").forEach((mech) => {
        const en = mech.trim()
        const ja = translateMechanic(en)
        const existing = mechanicMap.get(ja)
        mechanicMap.set(ja, { count: (existing?.count ?? 0) + 1, nameEn: en })
      })
    }
  })
  const topMechanics = Array.from(mechanicMap, ([name, { count, nameEn }]) => ({ name, nameEn, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const titles = calculateTitles({
    entries: entries.map((e) => ({ gameId: e.gameId, rating: e.rating })),
    sessions: allSessions.map((s) => ({ playedAt: s.playedAt, gameId: s.gameId })),
  })

  const shareText = encodeURIComponent(displayName + "のボードゲームプロフィール🎲")
  const shareUrl = encodeURIComponent("https://board-log.pekori.dev/u/" + username)

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        {/* Profile Header */}
        <div className="wood-card mb-12 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
              {/* Avatar */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-amber-100/50 to-amber-200/50 shadow-lg">
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

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-950">
                  {displayName}
                </h1>
                <p className="mt-0.5 text-sm font-medium text-amber-700/70">@{username}</p>
                <div className="mt-2">
                  <a
                    href={"https://x.com/intent/tweet?text=" + shareText + "&url=" + shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    シェア
                  </a>
                </div>
                {genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/"
              className="shrink-0 text-xs text-amber-700 underline hover:text-amber-950"
            >
              BoardLogで記録する
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-12">
          <div className="wood-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-950">{totalPlays}</p>
                <p className="text-xs text-amber-700">プレイ</p>
              </div>
              <div className="h-8 w-px bg-amber-200/40" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-950">{uniqueGames}</p>
                <p className="text-xs text-amber-700">ゲーム種類</p>
              </div>
              <div className="h-8 w-px bg-amber-200/40" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-950">{averageRating}</p>
                <p className="text-xs text-amber-700">平均評価</p>
              </div>
            </div>
          </div>
        </div>

        {/* Titles */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">称号</h2>
          <TitleBadges titles={titles} />
        </div>

        {/* Favorite Games */}
        {favoriteGames.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-amber-950">
                お気に入りゲーム
              </h2>
              <p className="text-sm text-amber-800">評価5のゲーム</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favoriteGames.map((game) => (
                <div key={game.id} className="wood-card overflow-hidden rounded-2xl shadow-sm">
                  <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.nameJa ?? game.name}
                        fill
                        className="object-contain p-3"
                        sizes="200px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-amber-300">
                        <span className="text-4xl">🎲</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold text-amber-950">
                      {game.nameJa ?? game.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カテゴリ統計 */}
        {topCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-amber-950">よく遊ぶカテゴリ</h2>
            <div className="wood-card rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {topCategories.map(({ name, count }, i) => (
                  <span
                    key={name}
                    className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium " + tagClass(i)}
                  >
                    {name}
                    <span className={"text-xs " + (i === 0 ? "text-amber-200" : "text-amber-600")}>
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* メカニクス統計 */}
        {topMechanics.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-amber-950">よく遊ぶメカニクス</h2>
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

        {/* All Play History */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
            {"プレイ履歴"}<span className="ml-2 text-base font-normal text-amber-800/60">{uniqueGames}タイトル</span>
          </h2>
          {entries.length === 0 ? (
            <div className="wood-card rounded-2xl p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">🎲</div>
              <p className="text-lg font-medium text-amber-900">まだプレイ記録がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {entries.map((entry) => {
                const latestSession = entry.sessions[0]
                return (
                  <div
                    key={entry.id}
                    className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm"
                  >
                    <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                      {entry.game.imageUrl ? (
                        <Image
                          src={entry.game.imageUrl}
                          alt={entry.game.nameJa ?? entry.game.name}
                          fill
                          className="object-contain p-3"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-amber-300">
                          <span className="text-4xl">🎲</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="mb-1.5 line-clamp-2 text-xs font-semibold text-amber-950">
                        {entry.game.nameJa ?? entry.game.name}
                      </p>
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
                      {latestSession && (
                        <p className="mt-1 text-xs text-amber-700/60">
                          {new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric" }).format(latestSession.playedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
