"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  readonly callbackUrl: string
}

export function SignupClient({ callbackUrl }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("パスワードが一致しません")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: displayName || undefined, username: username || undefined }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setError(json.error ?? "登録に失敗しました")
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="wood-card rounded-2xl p-8 shadow-lg text-center">
          <p className="mb-4 text-4xl">📧</p>
          <h1 className="text-xl font-bold tracking-tight text-amber-950 mb-3">確認メールを送信しました</h1>
          <p className="text-sm text-amber-800/70 leading-relaxed mb-6">
            <span className="font-medium text-amber-900">{email}</span> に確認メールを送信しました。<br />
            メール内のリンクをクリックして登録を完了してから、ログインしてください。
          </p>
          <Link
            href={"/signin?callbackUrl=" + encodeURIComponent(callbackUrl)}
            className="block w-full rounded-xl bg-amber-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 text-center"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="wood-card rounded-2xl p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="mb-3 text-4xl">🎲</p>
          <h1 className="text-2xl font-bold tracking-tight text-amber-950">アカウント作成</h1>
          <p className="mt-2 text-sm text-amber-800/70">
            メールアドレスとパスワードで登録
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-amber-800">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-amber-800">
              パスワード（8文字以上） <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-amber-800">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="border-t border-amber-100 pt-4">
            <p className="mb-3 text-xs text-amber-800/60">プロフィール（後から変更できます）</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="displayName" className="mb-1.5 block text-xs font-medium text-amber-800">
                  表示名
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：ボドゲ太郎"
                  maxLength={50}
                  className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div>
                <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-amber-800">
                  ユーザー名
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-amber-400">@</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="例：boardgame_taro"
                    maxLength={20}
                    pattern="[a-zA-Z0-9_-]{3,20}"
                    className="w-full rounded-xl border border-amber-200 bg-white/80 pl-8 pr-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <p className="mt-1 text-xs text-amber-700/50">3〜20文字の半角英数字・アンダースコア・ハイフン</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-amber-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 disabled:opacity-50"
          >
            {submitting ? "登録中…" : "アカウントを作成"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-amber-800/70">
          すでにアカウントをお持ちの方は{" "}
          <Link href={"/signin?callbackUrl=" + encodeURIComponent(callbackUrl)} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
