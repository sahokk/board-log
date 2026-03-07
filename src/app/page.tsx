import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">BoardLog</h1>
      <p className="mb-8 max-w-md text-center text-lg text-gray-600">
        ボードゲームの思い出を記録しよう
      </p>
      <div className="flex gap-4">
        <Link
          href="/search"
          className="rounded-md bg-gray-900 px-6 py-3 text-white hover:bg-gray-700"
        >
          ゲームを探す
        </Link>
        <Link
          href="/plays"
          className="rounded-md border border-gray-300 px-6 py-3 text-gray-900 hover:bg-gray-50"
        >
          プレイ履歴を見る
        </Link>
      </div>
    </div>
  )
}
