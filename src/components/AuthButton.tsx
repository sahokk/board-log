"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser } from "@fortawesome/free-solid-svg-icons"

interface Props {
  readonly username?: string | null
}

export function AuthButton({ username }: Props) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  if (status === "loading") {
    return <span className="text-sm text-gray-400">...</span>
  }

  if (session) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
        >
          {session.user?.image ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <FontAwesomeIcon icon={faUser} className="size-4 text-gray-500" />
            </div>
          )}
        </button>

        {isOpen && (
          <div className="wood-card absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl shadow-lg">
            <div className="border-b border-amber-200/50 px-4 py-3">
              <p className="text-sm font-medium text-amber-950">
                {session.user?.name}
              </p>
              <p className="text-xs text-amber-800/70">{session.user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-100/30"
              >
                プロフィール設定
              </Link>
              {username && (
                <Link
                  href={`/u/${username}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-100/30"
                >
                  公開プロフィール
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                className="w-full px-4 py-2 text-left text-sm text-amber-900 transition-colors hover:bg-amber-100/30"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href="/signin"
      className="rounded-xl bg-amber-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
    >
      ログイン
    </Link>
  )
}

