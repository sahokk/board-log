import Image from "next/image"
import {
  getDisplayName,
  getProfileImage,
  parseFavoriteGenres,
} from "@/lib/profile-utils"
import type { TitleWithUnlocked } from "@/lib/titles"

interface Game {
  id: string
  name: string
  imageUrl: string | null
}

interface UserData {
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
}

interface Stats {
  totalPlays: number
  uniqueGames: number
  averageRating: string
}

interface Props {
  user: UserData
  stats: Stats
  favoriteGames: Game[]
  titles: TitleWithUnlocked[]
}

export function BusinessCard({ user, stats, favoriteGames, titles }: Props) {
  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  const displayGames = favoriteGames.slice(0, 5)
  const unlockedTitles = titles.filter((t) => t.unlocked)

  return (
    <div className="relative mx-auto" style={{ width: "800px", height: "1000px" }}>
      <div className="wood-card h-full w-full overflow-hidden rounded-3xl shadow-2xl">
        {/* Top accent bar */}
        <div
          style={{
            height: "6px",
            background: "linear-gradient(to right, #78350f, #92400e, #b45309, #d97706)",
          }}
        />

        <div className="flex h-full flex-col px-10 pt-8 pb-6">
          {/* Header: Avatar + Name (left-aligned) */}
          <div className="mb-8 flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-amber-100 shadow-lg ring-4 ring-amber-200/50">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-amber-400">
                  👤
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-amber-950">
                {displayName}
              </h1>
              {genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compact stats row */}
          <div className="mx-auto mb-8 flex w-full max-w-md items-center justify-center gap-12 rounded-2xl bg-amber-50/50 py-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-950">{stats.totalPlays}</p>
              <p className="mt-0.5 text-xs text-amber-700">プレイ</p>
            </div>
            <div className="h-8 w-px bg-amber-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-950">{stats.uniqueGames}</p>
              <p className="mt-0.5 text-xs text-amber-700">ゲーム種類</p>
            </div>
            <div className="h-8 w-px bg-amber-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-950">{stats.averageRating}</p>
              <p className="mt-0.5 text-xs text-amber-700">平均評価</p>
            </div>
          </div>

          {/* Favorite Games */}
          {displayGames.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-base font-bold text-amber-900">
                お気に入りゲーム
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {displayGames.map((game) => (
                  <div
                    key={game.id}
                    className="overflow-hidden rounded-xl bg-amber-50/30 shadow-sm"
                  >
                    <div className="relative aspect-square bg-amber-100/30">
                      {game.imageUrl ? (
                        <Image
                          src={game.imageUrl}
                          alt={game.name}
                          fill
                          className="object-contain p-2"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-amber-300">
                          🎲
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="line-clamp-1 text-[10px] font-semibold text-amber-950">
                        {game.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Titles */}
          {unlockedTitles.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-amber-900">称号</h2>
              <div className="flex flex-wrap gap-2">
                {unlockedTitles.map((title) => (
                  <div
                    key={title.id}
                    className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 shadow-sm"
                  >
                    <span className="text-base">{title.icon}</span>
                    <span className="text-xs font-medium text-amber-950">
                      {title.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: BoardLog Branding */}
          <div className="mt-auto border-t border-amber-200/50 pt-4 text-center">
            <p className="text-lg font-semibold text-amber-800">🎲 BoardLog</p>
            <p className="mt-0.5 text-xs text-amber-600/70">
              ボードゲームの思い出アルバム
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
