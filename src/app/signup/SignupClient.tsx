"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"

interface Props {
  readonly callbackUrl: string
}

export function SignupClient({ callbackUrl }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setError(json.error ?? "登録に失敗しました")
        return
      }
      // Sign in automatically after signup
      await signIn("credentials", { email, password, callbackUrl })
    } finally {
      setSubmitting(false)
    }
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
              メールアドレス
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
              パスワード（8文字以上）
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
              パスワード（確認）
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
