import Image from "next/image"
import Link from "next/link"
import { WishlistButton } from "@/components/WishlistButton"

interface Props {
  readonly gameId: string
  readonly detailHref: string
  readonly name: string
  readonly imageUrl?: string | null
  readonly subtext?: string | null
  readonly year?: number | null
  readonly wishlisted: boolean
  readonly sizes?: string
}

export function GameCard({ gameId, detailHref, name, imageUrl, subtext, year, wishlisted, sizes = "(max-width: 640px) 50vw, 25vw" }: Props) {
  return (
    <div className="wood-card flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={detailHref} className="flex flex-1 flex-col">
        <div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-3"
              sizes={sizes}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-amber-300">
              <span className="text-4xl">🎲</span>
            </div>
          )}
        </div>
        <div className="px-3 pb-1 pt-2">
          <p className="mb-1 line-clamp-2 text-xs font-semibold text-amber-950">{name}</p>
          {subtext && <p className="mt-0.5 text-xs text-amber-700/50">{subtext}</p>}
          {!!year && <p className="mt-0.5 text-xs font-medium text-amber-700/60">{year}年</p>}
        </div>
      </Link>

      <div className="flex items-center gap-1.5 px-3 pb-3 pt-1">
        <Link
          href={`/record?gameId=${gameId}`}
          className="flex-1 rounded-lg bg-amber-900 px-2 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-amber-800"
        >
          遊んだ！
        </Link>
        <WishlistButton gameId={gameId} initialWishlisted={wishlisted} size="icon" />
      </div>
    </div>
  )
}
