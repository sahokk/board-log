import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuthButton } from "@/components/AuthButton"

export async function Header() {
  const session = await auth()
  const username = session?.user?.id
    ? (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      }))?.username ?? null
    : null

  return (
    <header className="wood-header backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-amber-950">
          🎲 BoardLog
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/plays"
            className="text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
          >
            プレイ履歴
          </Link>
          <Link
            href="/wishlist"
            className="text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
          >
            ♡ 気になる
          </Link>
          <AuthButton username={username} />
        </nav>
      </div>
    </header>
  )
}
