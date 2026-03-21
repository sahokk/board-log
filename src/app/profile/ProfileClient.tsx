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
import { MechanicTag } from "@/components/MechanicTag"
import type { TitleWithUnlocked } from "@/lib/titles"

interface Game {
  id: string
  entryId: string
  name: string
  nameJa?: string | null
  imageUrl: string | null
}

interface UserData {
  username?: string | null
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

interface TagCount {
  name: string
  nameEn?: string // メカニクスのツールチップ用英語名
  count: number
}

interface WeightBucket {
  label: string
  count: number
}

interface Props {
  user: UserData
  stats: Stats
  ratingCounts: RatingCount[]
  favoriteGames: Game[]
  playDates: PlayDate[]
  titles: TitleWithUnlocked[]
  topCategories: TagCount[]
  topMechanics: TagCount[]
  weightDistribution: WeightBucket[]
}

function tagClass(i: number): string {
  if (i === 0) return "bg-amber-700 text-white"
  if (i < 3) return "bg-amber-200 text-amber-900"
  return "bg-amber-100/70 text-amber-800"
}

export function ProfileClient({ user, stats, ratingCounts, favoriteGames, playDates, titles, topCategories, topMechanics, weightDistribution }: Readonly<Props>) {
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
            initialUsername={user.username ?? null}
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
              {user.username && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <a
                    href={`/u/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-amber-700 underline hover:text-amber-950"
                  >
                    board-log.pekori.dev/u/{user.username}
                  </a>
                  <a
                    href={"https://x.com/intent/tweet?text=" + encodeURIComponent(displayName + "のボードゲームプロフィール🎲") + "&url=" + encodeURIComponent("https://board-log.pekori.dev/u/" + user.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    シェア
                  </a>
                </div>
              )}
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

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
          >
            編集する
          </button>
        </div>
      </div>

      {/* Statistics & Rating Distribution */}
      <div className="mb-12">
        <div className="wood-card rounded-2xl p-5 shadow-sm">
          {/* Compact stats row */}
          <div className="flex items-center justify-around border-b border-amber-200/40 pb-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-950">{stats.totalPlays}</p>
              <p className="text-xs text-amber-700">プレイ</p>
            </div>
            <div className="h-8 w-px bg-amber-200/40" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-950">{stats.uniqueGames}</p>
              <p className="text-xs text-amber-700">ゲーム種類</p>
            </div>
            <div className="h-8 w-px bg-amber-200/40" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-950">{stats.averageRating}</p>
              <p className="text-xs text-amber-700">平均評価</p>
            </div>
          </div>
          {/* Rating distribution */}
          <div className="space-y-2">
            {ratingCounts.map(({ rating, count }) => {
              const percentage = stats.uniqueGames > 0 ? (count / stats.uniqueGames) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex w-20 shrink-0 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= rating ? "text-amber-500" : "text-amber-200/40"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="h-5 overflow-hidden rounded-md bg-amber-100/40">
                      <div
                        className="h-full bg-linear-to-r from-amber-500 to-amber-600 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs font-medium text-amber-700">
                    {count}作品
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
              <Link
                key={game.id}
                href={`/plays/${game.entryId}`}
                className="wood-card overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
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
              </Link>
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${tagClass(i)}`}
                >
                  {name}
                  <span className={`text-xs ${i === 0 ? "text-amber-200" : "text-amber-600"}`}>
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
                <span key={name} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${tagClass(i)}`}>
                  <MechanicTag name={nameEn ?? name} variant="bare" />
                  <span className={`text-xs ${i === 0 ? "text-amber-200" : "text-amber-600"}`}>
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 複雑度分布 */}
      {weightDistribution.some((b) => b.count > 0) && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-amber-950">ゲームの重量傾向</h2>
          <div className="wood-card rounded-2xl p-5 shadow-sm">
            {/* 積み上げ横棒 */}
            {(() => {
              const total = weightDistribution.reduce((s, b) => s + b.count, 0)
              const colors = ["bg-amber-200", "bg-amber-400", "bg-amber-600", "bg-amber-800"]
              const filled = weightDistribution.filter((b) => b.count > 0)
              return (
                <>
                  <div className="mb-3 flex h-7 w-full overflow-hidden rounded-full">
                    {filled.map(({ label, count }) => {
                      const pct = total > 0 ? (count / total) * 100 : 0
                      return (
                        <div
                          key={label}
                          className={`${colors[weightDistribution.findIndex(b => b.label === label)]} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-amber-800/70 mb-4">
                    <span>軽量級</span>
                    <span>重量級</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {weightDistribution.map(({ label, count }, i) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${colors[i]}`} />
                        <div>
                          <p className="text-xs font-medium text-amber-900">{label}</p>
                          <p className="text-xs text-amber-700">{count}作品</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Titles / Achievements */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-amber-950">
          称号
        </h2>
        <TitleBadges titles={titles} />
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
              titles={titles}
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
