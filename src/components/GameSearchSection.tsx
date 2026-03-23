import { SearchClient } from "@/components/SearchClient"

interface Props {
  readonly username?: string | null
}

export function GameSearchSection({ username }: Props) {
  return (
    <div className="wood-card rounded-2xl p-8 shadow-sm">
      <SearchClient username={username} />
    </div>
  )
}
