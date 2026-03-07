import Link from "next/link"
import { AuthButton } from "@/components/AuthButton"

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          BoardLog
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/plays"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            プレイ履歴
          </Link>
          <Link
            href="/search"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ゲーム検索
          </Link>
          <Link
            href="/record"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            記録する
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}
