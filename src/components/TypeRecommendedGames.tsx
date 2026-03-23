import Link from "next/link"
import type { TypeRecommendedGame } from "@/lib/recommendations"
import { GameImage } from "@/components/GameImage"

interface Props {
  readonly games: TypeRecommendedGame[]
}

export function TypeRecommendedGames({ games }: Props) {
  if (games.length === 0) return null

  return (
    <div className="wood-card rounded-2xl p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-amber-950">このタイプにおすすめのゲーム</h3>
      <div className="grid grid-cols-4 gap-3">
        {games.map((game) => {
          const name = game.nameJa ?? game.nameEn
          const href = game.id ? `/games/${game.id}` : `https://boardgamegeek.com/boardgame/${game.bggId}`
          const isExternal = !game.id

          return isExternal ? (
            <a
              key={game.bggId}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5"
            >
              <GameCard game={game} name={name} />
            </a>
          ) : (
            <Link
              key={game.bggId}
              href={href}
              className="group flex flex-col items-center gap-1.5"
            >
              <GameCard game={game} name={name} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function GameCard({ game, name }: { readonly game: TypeRecommendedGame; readonly name: string }) {
  return (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-amber-100/60 shadow-sm ring-1 ring-amber-200/40 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <GameImage
          src={game.imageUrl}
          alt={name}
          sizes="(max-width: 640px) 25vw, 120px"
          className="object-contain"
          fallbackClassName="flex h-full items-center justify-center text-2xl text-amber-300"
        />
      </div>
      <p className="line-clamp-2 text-center text-xs leading-tight text-amber-900">
        {name}
      </p>
    </>
  )
}
