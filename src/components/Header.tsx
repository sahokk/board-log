import Link from "next/link"
import { AuthButton } from "@/components/AuthButton"

export function Header() {
  return (
    <header className="wood-header backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-amber-950">
          🎲 BoardLog
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/plays"
            className="text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
          >
            プレイ履歴
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}
