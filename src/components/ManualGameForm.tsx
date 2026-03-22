"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { GiDiceSixFacesFive } from "react-icons/gi"

interface Props {
  onCancel: () => void
  initialName?: string
}

export function ManualGameForm({ onCancel, initialName = "" }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ファイルサイズは5MB以下にしてください")
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("ゲーム名を入力してください")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      let imageUrl = ""

      // Upload image if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload?type=game", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "アップロードに失敗しました")

        imageUrl = uploadData.url
      }

      // Create game
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl: imageUrl || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "ゲームの登録に失敗しました")

      // Navigate to record page with the new game
      router.push(`/record?gameId=${data.game.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Game Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          ゲーム名 <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: カタン、アグリコラ"
          className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-sm text-amber-950 shadow-sm placeholder:text-amber-700/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          autoFocus
        />
      </div>

      {/* Box Image Upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-amber-900">
          箱画像（任意）
        </label>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-amber-100">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-amber-300">
                <GiDiceSixFacesFive size={36} />
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="wood-card flex-1 rounded-xl px-6 py-3 text-center text-sm font-medium text-amber-900 shadow-sm transition-all hover:bg-amber-100/30 disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="flex-1 rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md disabled:opacity-50"
        >
          {submitting ? "登録中..." : "登録して遊んだ！"}
        </button>
      </div>
    </form>
  )
}
