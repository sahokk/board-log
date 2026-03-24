import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { HeaderNav } from "@/components/HeaderNav"

export async function Header() {
  const session = await auth()
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, role: true },
      })
    : null
  const username = dbUser?.username ?? null
  const isAdmin = dbUser?.role === "ADMIN"
  const pendingReports = isAdmin
    ? await prisma.nameReport.count({ where: { status: "PENDING" } })
    : 0

  return (
    <header className="wood-header relative z-50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-logo text-xl font-semibold tracking-tight text-amber-950">
          🎲 Boardory
        </Link>
        <HeaderNav
          username={username}
          isAdmin={isAdmin}
          isLoggedIn={!!session?.user}
          pendingReports={pendingReports}
        />
      </div>
    </header>
  )
}
