import { SearchClient } from "./SearchClient"

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">ゲーム検索</h1>
      <SearchClient />
    </div>
  )
}
