import Image from "next/image"
import {
  getDisplayName,
  getProfileImage,
  parseFavoriteGenres,
} from "@/lib/profile-utils"

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
}

export function BusinessCard({ user, stats, favoriteGames }: Props) {
  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  // Limit to 5 games for display
  const displayGames = favoriteGames.slice(0, 5)

  return (
    <div className="relative mx-auto" style={{ width: "800px", height: "1000px" }}>
      {/* Wood grain background */}
      <div className="wood-card h-full w-full overflow-hidden rounded-3xl p-12 shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header: Avatar + Name */}
          <div className="mb-8 flex items-center gap-6">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-amber-100 shadow-lg ring-4 ring-amber-200/50">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl text-amber-400">
                  👤
                </div>
              )}
            </div>
            <div>
              <h1 className="text-5xl font-bold text-amber-950">{displayName}</h1>
              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-8 grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-amber-50/50 p-6 text-center">
              <p className="text-5xl font-bold text-amber-950">{stats.totalPlays}</p>
              <p className="mt-2 text-base font-medium text-amber-800">総プレイ数</p>
            </div>
            <div className="rounded-2xl bg-amber-50/50 p-6 text-center">
              <p className="text-5xl font-bold text-amber-950">{stats.uniqueGames}</p>
              <p className="mt-2 text-base font-medium text-amber-800">ゲーム種類</p>
            </div>
            <div className="rounded-2xl bg-amber-50/50 p-6 text-center">
              <p className="text-5xl font-bold text-amber-950">{stats.averageRating}</p>
              <p className="mt-2 text-base font-medium text-amber-800">平均評価</p>
            </div>
          </div>

          {/* Favorite Games */}
          {displayGames.length > 0 && (
            <div className="flex-1">
              <h2 className="mb-4 text-2xl font-bold text-amber-950">お気に入りゲーム</h2>
              <div className="grid grid-cols-5 gap-4">
                {displayGames.map((game) => (
                  <div
                    key={game.id}
                    className="overflow-hidden rounded-2xl bg-amber-50/30 shadow-sm"
                  >
                    <div className="relative aspect-square bg-amber-100/30">
                      {game.imageUrl ? (
                        <Image
                          src={game.imageUrl}
                          alt={game.name}
                          fill
                          className="object-contain p-2"
                          sizes="140px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-amber-300">
                          🎲
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold text-amber-950">
                        {game.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: BoardLog Branding */}
          <div className="mt-8 border-t border-amber-200/50 pt-6 text-center">
            <p className="text-2xl font-semibold text-amber-800">🎲 BoardLog</p>
            <p className="mt-1 text-sm text-amber-700/60">
              ボードゲームの思い出アルバム
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
