"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  getDisplayName,
  getProfileImage,
  parseFavoriteGenres,
} from "@/lib/profile-utils"
import { ProfileEditForm } from "@/components/ProfileEditForm"
import { BusinessCardExporter } from "@/components/BusinessCardExporter"
import { PlayCalendar } from "@/components/PlayCalendar"
import { TitleBadges } from "@/components/TitleBadges"
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
  email?: string | null
}

interface Stats {
  totalPlays: number
  uniqueGames: number
  averageRating: string
}

interface RatingCount {
  rating: number
  count: number
}

interface PlayDate {
  date: string
  count: number
}

interface Props {
  user: UserData
  stats: Stats
  ratingCounts: RatingCount[]
  favoriteGames: Game[]
  playDates: PlayDate[]
  titles: TitleWithUnlocked[]
}

export function ProfileClient({ user, stats, ratingCounts, favoriteGames, playDates, titles }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  const handleSaveSuccess = () => {
    setIsEditing(false)
    router.refresh() // Reload server component data
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">
            プロフィール編集
          </h1>
        </div>
        <div className="wood-card rounded-2xl p-8 shadow-sm">
          <ProfileEditForm
            initialDisplayName={displayName}
            initialImageUrl={profileImage}
            initialFavoriteGenres={user.favoriteGenres || ""}
            onCancel={() => setIsEditing(false)}
            onSuccess={handleSaveSuccess}
          />
        </div>
      </div>
    )
  }

  return (
    <>
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
              <p className="mt-1 text-sm text-amber-800/70 truncate">{user.email}</p>
              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
          >
            編集する
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">統計</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="wood-card rounded-2xl p-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-amber-950">{stats.totalPlays}</p>
            <p className="mt-2 text-sm font-medium text-amber-800">総プレイ数</p>
          </div>
          <div className="wood-card rounded-2xl p-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-amber-950">{stats.uniqueGames}</p>
            <p className="mt-2 text-sm font-medium text-amber-800">ゲーム種類</p>
          </div>
          <div className="wood-card rounded-2xl p-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-amber-950">{stats.averageRating}</p>
            <p className="mt-2 text-sm font-medium text-amber-800">平均評価</p>
          </div>
        </div>
      </div>

      {/* Play Calendar */}
      {stats.totalPlays > 0 && (
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
            プレイカレンダー
          </h2>
          <PlayCalendar playDates={playDates} />
        </div>
      )}

      {/* Rating Distribution */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
          評価分布
        </h2>
        <div className="wood-card space-y-3 rounded-2xl p-6 shadow-sm">
          {ratingCounts.map(({ rating, count }) => {
            const percentage = stats.totalPlays > 0 ? (count / stats.totalPlays) * 100 : 0
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex w-24 shrink-0 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= rating ? "text-amber-500" : "text-amber-200/40"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="h-8 overflow-hidden rounded-lg bg-amber-100/40">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-amber-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right text-sm font-medium text-amber-800">
                  {count}回
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Titles / Achievements */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
          称号
        </h2>
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
              <div
                key={game.id}
                className="wood-card overflow-hidden rounded-2xl shadow-sm"
              >
                <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={game.name}
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
                    {game.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Card Section */}
      {stats.totalPlays > 0 && (
        <div className="mb-12">
          <div className="wood-card rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-amber-950 mb-1 flex items-center gap-2">
                <span>🎴</span>
                <span>ボドゲ名刺</span>
              </h3>
              <p className="text-sm text-amber-800">
                あなたの統計とお気に入りを1枚の画像に
              </p>
            </div>
            <BusinessCardExporter
              user={user}
              stats={stats}
              favoriteGames={favoriteGames}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalPlays === 0 && (
        <div className="wood-card rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">🎲</div>
          <p className="mb-2 text-lg font-medium text-amber-900">
            まだプレイ記録がありません
          </p>
          <p className="mb-6 text-sm text-amber-800/70">
            ゲームをプレイしたら記録してみましょう
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
          >
            ゲームを探す
          </Link>
        </div>
      )}
    </>
  )
}
