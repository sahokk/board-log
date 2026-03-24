"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFlag } from "@fortawesome/free-solid-svg-icons"

interface Props {
  gameId: string
  currentNameJa?: string | null
}

export default function ReportNameButton({ gameId, currentNameJa }: Props) {
  const [open, setOpen] = useState(false)
  const [suggestedName, setSuggestedName] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, suggestedName, reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "送信に失敗しました")
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setDone(false)
    setSuggestedName("")
    setReason("")
    setError("")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors"
        title="日本語名の修正を報告"
      >
        <FontAwesomeIcon icon={faFlag} className="text-[10px]" />
        名称を報告
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1">日本語名の修正を報告</h2>
            {currentNameJa && (
              <p className="text-sm text-gray-500 mb-4">
                現在の名前: <span className="font-medium text-gray-700">{currentNameJa}</span>
              </p>
            )}

            {done ? (
              <div className="text-center py-6">
                <p className="text-green-600 font-medium mb-4">報告を送信しました。ありがとうございます！</p>
                <button onClick={handleClose} className="px-6 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600">
                  閉じる
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    正しい日本語名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={suggestedName}
                    onChange={(e) => setSuggestedName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="正しい日本語名を入力"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">コメント（任意）</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    rows={3}
                    placeholder="理由や参考リンクなど"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !suggestedName.trim()}
                    className="px-6 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                  >
                    {submitting ? "送信中..." : "送信"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
