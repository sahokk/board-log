"use client"

import { useState } from "react"
import Image from "next/image"

const GENRE_OPTIONS = [
  "戦略",
  "協力",
  "パーティー",
  "ファミリー",
  "抽象",
  "デッキ構築",
  "ワーカープレイスメント",
  "エリアコントロール",
  "ダイス",
  "カードゲーム",
  "正体隠匿",
  "交渉",
  "競り",
  "パズル",
  "ドラフト",
  "拡大再生産",
  "レガシー",
  "推理",
] as const

interface Props {
  initialUsername: string | null
  initialDisplayName: string
  initialImageUrl: string | null
  initialFavoriteGenres: string
  onCancel: () => void
  onSuccess: () => void
}

export function ProfileEditForm({
  initialUsername,
  initialDisplayName,
  initialImageUrl,
  initialFavoriteGenres,
  onCancel,
  onSuccess,
}: Props) {
  const [username, setUsername] = useState(initialUsername ?? "")
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    if (!initialFavoriteGenres) return []
    return initialFavoriteGenres.split(",").map((g) => g.trim()).filter((g) => g.length > 0)
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("ファイルサイズは5MB以下にしてください")
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      let imageUrl = initialImageUrl || ""

      // Upload file if selected
      if (selectedFile) {
        setUploading(true)
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "アップロードに失敗しました")

        imageUrl = uploadData.url
        setUploading(false)
      }

      // Update user profile
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim() || null,
          displayName: displayName.trim(),
          customImageUrl: imageUrl,
          favoriteGenres: selectedGenres.join(", "),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました")

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          ユーザー名
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-amber-800/60">/u/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_name"
            className="flex-1 rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <p className="mt-1 text-xs text-amber-800/70">
          3〜20文字の半角英数字・アンダースコア・ハイフン。公開プロフィールのURLになります。
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          表示名
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="山田 太郎"
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Profile Image Upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          プロフィール画像
        </label>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-amber-100 ring-2 ring-amber-200">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-amber-400">
                👤
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-amber-900 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-amber-800"
            />
            <p className="mt-1 text-xs text-amber-800/70">
              JPEG, PNG, WebP, GIF (最大5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Favorite Genres */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          好きなジャンル
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => {
            const isSelected = selectedGenres.includes(genre)
            return (
              <button
                key={genre}
                type="button"
                onClick={() => {
                  setSelectedGenres((prev) =>
                    isSelected
                      ? prev.filter((g) => g !== genre)
                      : [...prev, genre]
                  )
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-amber-900 text-white"
                    : "bg-amber-100/60 text-amber-800 hover:bg-amber-200/60"
                }`}
              >
                {genre}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-amber-800/70">
          タップして選択（複数選択可）
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="wood-card flex-1 rounded-xl px-6 py-3 text-center text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex-1 rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:opacity-50"
        >
          {uploading ? "アップロード中..." : submitting ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  )
}
