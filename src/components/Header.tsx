import Link from "next/link"
import { AuthButton } from "@/components/AuthButton"

export function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900">
          BoardLog
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/plays"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            プレイ履歴
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}
