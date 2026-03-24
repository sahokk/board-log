import { Suspense } from "react"
import { SearchClient } from "@/components/SearchClient"

export function GameSearchSection() {
  return (
    <Suspense>
      <SearchClient />
    </Suspense>
  )
}
