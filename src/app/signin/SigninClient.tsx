"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"

interface Props {
  readonly callbackUrl: string
  readonly error?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "このメールアドレスは別のプロバイダーで登録済みです。以前使ったログイン方法をお試しください。",
  OAuthCallbackError: "ログインに失敗しました。もう一度お試しください。",
  CredentialsSignin: "メールアドレスまたはパスワードが正しくありません。",
  Default: "ログインに失敗しました。もう一度お試しください。",
}

export function SigninClient({ callbackUrl, error }: Props) {
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const doSignin = async () => {
    if (!email.trim() || !password || signingIn) return
    setFormError(null)
    setSigningIn(true)
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      })
      if (result?.error) {
        setFormError(ERROR_MESSAGES.CredentialsSignin)
      } else if (result?.url) {
        globalThis.location.href = result.url
      }
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="wood-card rounded-2xl p-8 shadow-lg">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <p className="mb-3 text-4xl">🎲</p>
          <h1 className="text-2xl font-bold tracking-tight text-amber-950">Boardory にログイン</h1>
          <p className="mt-2 text-sm text-amber-800/70">
            遊んだゲームを記録して、あなたのボドゲライフを残そう
          </p>
        </div>

        {/* エラーメッセージ */}
        {(errorMsg ?? formError) && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg ?? formError}
          </div>
        )}

        {/* パスワードログイン */}
        <form onSubmit={(e) => { e.preventDefault(); void doSignin() }} className="mb-5 space-y-3">
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
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 placeholder-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || !password || signingIn}
            className="w-full rounded-xl bg-amber-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 disabled:opacity-50"
          >
            {signingIn ? "ログイン中…" : "ログイン"}
          </button>
          <p className="text-center text-xs text-amber-800/70">
            アカウントをお持ちでない方は{" "}
            <Link
              href={"/signup?callbackUrl=" + encodeURIComponent(callbackUrl)}
              className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              新規登録
            </Link>
          </p>
        </form>

        {/* 区切り */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-amber-200" />
          <span className="text-xs text-amber-500">または</span>
          <div className="h-px flex-1 bg-amber-200" />
        </div>

        {/* Google ログイン */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-amber-950 shadow-sm transition-all hover:bg-amber-50 hover:shadow-md"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google でログイン
        </button>
      </div>
    </div>
  )
}
