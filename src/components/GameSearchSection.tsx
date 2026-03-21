import { SearchClient } from "@/components/SearchClient"

interface GameSearchSectionProps {
  isLoggedIn?: boolean
}

export function GameSearchSection({ isLoggedIn = false }: GameSearchSectionProps) {
  return (
    <div className="wood-card rounded-2xl p-8 shadow-sm">
      <SearchClient isLoggedIn={isLoggedIn} />
    </div>
  )
}
