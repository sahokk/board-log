"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { getDisplayName, getProfileImage } from "@/lib/profile-utils"
import { ProfileEditForm } from "@/components/ProfileEditForm"
import { BusinessCardExporter } from "@/components/BusinessCardExporter"
import { BoardgameTypeCard } from "@/components/BoardgameTypeCard"
import type { TitleWithUnlocked } from "@/lib/titles"
import type { BoardgameType } from "@/lib/boardgame-type"

interface Game {
  id: string
  entryId: string
  name: string
  imageUrl: string | null
  sessionCount: number
  rating: number
}

interface UserData {
  username?: string | null
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
  email?: string | null
  isProfilePublic: boolean
}

interface Stats {
  totalPlays: number
  uniqueGames: number
}

interface Props {
  user: UserData
  stats: Stats
  allGames: Game[]
  featuredGames: Game[]
  savedFeaturedIds: string[]
  boardgameType: BoardgameType
  savedCardTheme: string
  titles: TitleWithUnlocked[]
}

export function ProfileClient({ user, stats, allGames, featuredGames, savedFeaturedIds, boardgameType, savedCardTheme, titles }: Readonly<Props>) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPublic, setIsPublic] = useState(user.isProfilePublic)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteEnabled, setDeleteEnabled] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!showDeleteConfirm) { setDeleteEnabled(false); return }
    const t = setTimeout(() => setDeleteEnabled(true), 2000)
    return () => clearTimeout(t)
  }, [showDeleteConfirm])

  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)

  const handleSaveSuccess = () => {
    setIsEditing(false)
    router.refresh()
  }

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProfilePublic: !isPublic }),
      })
      if (res.ok) setIsPublic((v) => !v)
    } finally {
      setTogglingVisibility(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/user", { method: "DELETE" })
      if (res.ok) await signOut({ redirectTo: "/" })
    } finally {
      setDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">プロフィール編集</h1>
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

        {/* アカウント削除 */}
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50/40 p-5">
          <h2 className="text-sm font-bold text-red-800">アカウント削除</h2>
          <p className="mt-1 text-xs text-red-700/70">
            アカウントを削除すると、プレイ記録・ウィッシュリストを含むすべてのデータが完全に削除されます。この操作は取り消せません。
          </p>
          {showDeleteConfirm ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-red-800">本当に削除しますか？</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deleteEnabled}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "削除中…" : "はい、削除する"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-lg border border-red-300 px-4 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              アカウントを削除する
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Profile Header */}
      <div className="wood-card mb-8 overflow-hidden rounded-2xl shadow-sm">
        <div className="h-1.5 bg-linear-to-r from-amber-700 via-amber-500 to-amber-300" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-amber-100/50 to-amber-200/50 shadow-lg ring-4 ring-amber-200/60">
                {profileImage ? (
                  <Image src={profileImage} alt={displayName} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-amber-400">👤</div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-amber-950">{displayName}</h1>
                {user.username && (
                  <p className="mt-0.5 text-sm text-amber-700/60">@{user.username}</p>
                )}
                <p className="mt-0.5 text-sm text-amber-800/50 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
            >
              編集する
            </button>
          </div>
        </div>
      </div>

      {/* 公開設定 */}
      <div className="wood-card mb-8 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-950">公開プロフィール</h2>
            <p className="mt-0.5 text-sm text-amber-800/70">
              {isPublic
                ? "公開中 — URLを知っている人なら誰でも閲覧できます"
                : "非公開 — URLにアクセスしても表示されません"}
            </p>
            {!user.username && (
              <p className="mt-1 text-xs text-amber-700/60">
                公開するにはユーザー名の設定が必要です
              </p>
            )}
            {user.username && isPublic && (
              <Link
                href={`/u/${user.username}`}
                target="_blank"
                className="mt-1.5 inline-block text-xs text-amber-700 underline hover:text-amber-950"
              >
                公開プロフィールを見る →
              </Link>
            )}
          </div>
          <button
            onClick={handleToggleVisibility}
            disabled={togglingVisibility || !user.username}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
              isPublic ? "bg-amber-700" : "bg-amber-200"
            }`}
            role="switch"
            aria-checked={isPublic}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 診断結果 */}
      {stats.totalPlays > 0 && (
        <div className="mb-8">
          <BoardgameTypeCard type={boardgameType} />
        </div>
      )}

      {/* Business Card */}
      {stats.totalPlays > 0 && (
        <div className="wood-card mb-8 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-amber-950">
              <span>🎴</span>ボドゲ名刺
            </h2>
            <p className="mt-0.5 text-sm text-amber-800/70">あなたの記録を1枚の画像にエクスポート</p>
          </div>
          <BusinessCardExporter
            user={user}
            stats={stats}
            allGames={allGames}
            featuredGames={featuredGames}
            savedFeaturedIds={savedFeaturedIds}
            boardgameType={boardgameType}
            savedCardTheme={savedCardTheme}
            titles={titles}
          />
        </div>
      )}

      {/* Empty state */}
      {stats.totalPlays === 0 && (
        <div className="wood-card rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">🎲</div>
          <p className="mb-2 text-lg font-medium text-amber-900">まだプレイ記録がありません</p>
          <p className="mb-6 text-sm text-amber-800/70">遊んだゲームを登録してみましょう</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
          >
            ゲームを探す
          </Link>
        </div>
      )}

    </>
  )
}
