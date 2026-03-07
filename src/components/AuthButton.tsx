"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <span className="text-sm text-gray-400">...</span>
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ログアウト
      </button>
    )
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
    >
      ログイン
    </button>
  )
}
