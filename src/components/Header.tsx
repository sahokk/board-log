import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuthButton } from "@/components/AuthButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faList } from "@fortawesome/free-solid-svg-icons"
import { faHeart } from "@fortawesome/free-regular-svg-icons"

export async function Header() {
  const session = await auth()
  const username = session?.user?.id
    ? (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      }))?.username ?? null
    : null

  return (
    <header className="wood-header relative z-50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-amber-950">
          🎲 Boardory
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          {session?.user && (
            <>
              <Link
                href="/plays"
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
              >
                <FontAwesomeIcon icon={faList} className="size-3.5 sm:size-4" />
                <span>遊んだゲーム</span>
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
              >
                <FontAwesomeIcon icon={faHeart} className="size-3.5 sm:size-4" />
                <span>気になる</span>
              </Link>
            </>
          )}
          <AuthButton username={username} />
        </nav>
      </div>
    </header>
  )
}
