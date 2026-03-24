"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLayerGroup, faShield, faBars, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faHeart } from "@fortawesome/free-regular-svg-icons"
import { AuthButton } from "@/components/AuthButton"

interface Props {
  readonly username: string | null
  readonly isAdmin: boolean
  readonly isLoggedIn: boolean
  readonly pendingReports: number
}

const navLinks = (isAdmin: boolean) => [
  { href: "/plays", label: "遊んだゲーム", icon: faLayerGroup },
  { href: "/wishlist", label: "気になる", icon: faHeart },
  ...(isAdmin ? [{ href: "/admin/reports", label: "Admin", icon: faShield }] : []),
]

export function HeaderNav({ username, isAdmin, isLoggedIn, pendingReports }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const links = navLinks(isAdmin)

  return (
    <nav className="flex items-center gap-2 sm:gap-4" ref={menuRef}>
      {/* Desktop nav links */}
      {isLoggedIn && (
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex items-center gap-1.5 text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
            >
              <FontAwesomeIcon icon={link.icon} className="size-4" />
              <span>{link.label}</span>
              {link.href === "/admin/reports" && pendingReports > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingReports}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <AuthButton username={username} />

      {/* Hamburger button — mobile only */}
      {isLoggedIn && (
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-amber-800 hover:bg-amber-100/50 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="メニュー"
        >
          <FontAwesomeIcon icon={open ? faXmark : faBars} className="size-5" />
        </button>
      )}

      {/* Mobile dropdown */}
      {open && isLoggedIn && (
        <div className="absolute top-16 left-0 right-0 z-40 wood-card border-t border-amber-200/40 shadow-lg md:hidden">
          <div className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100/40 transition-colors"
              >
                <FontAwesomeIcon icon={link.icon} className="size-4 text-amber-700" />
                <span>{link.label}</span>
                {link.href === "/admin/reports" && pendingReports > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {pendingReports}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
