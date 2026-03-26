import { Game } from "@/generated/prisma/client";
import { deduplicateMechanics } from "@/lib/bgg/mechanic-labels";
import { translateCategory } from "@/lib/bgg/translations";
import { faUsers, faClock, faScaleBalanced } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MechanicTag } from "./MechanicTag";

interface Props {
  readonly game: Game
}

export default function BggMetadata({ game }: Props) {
  return (
    <div className="wood-card mb-6 rounded-2xl p-6 shadow-sm space-y-4">
      {game.bggId && (
        <a
          href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline hover:text-amber-950"
        >
          BGGで詳細を見る →
        </a>
      )}
      {(game.minPlayers || game.maxPlayers || game.playingTime || game.weight) && (
        <div className="flex flex-wrap gap-4 text-sm text-amber-800/80">
          {(game.minPlayers || game.maxPlayers) && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUsers} className="size-3.5" />
              {game.minPlayers ?? "?"}{game.maxPlayers && game.maxPlayers !== game.minPlayers ? `〜${game.maxPlayers}` : ""}人
            </span>
          )}
          {game.playingTime && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="size-3.5" />
              {game.playingTime}分
            </span>
          )}
          {game.weight && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faScaleBalanced} className="size-3.5" />
              複雑度 {game.weight.toFixed(1)} / 5
            </span>
          )}
        </div>
      )}
      {game.categories && (
        <div>
          <p className="mb-2 text-xs font-medium text-amber-800/60">カテゴリ</p>
          <div className="flex flex-wrap gap-1.5">
            {game.categories.split(",").map((cat) => {
              const label = translateCategory(cat.trim())
              if (!label) return null
              return (
                <span key={cat} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      )}
      {game.mechanics && (
        <div>
          <p className="mb-2 text-xs font-medium text-amber-800/60">メカニクス</p>
          <div className="flex flex-wrap gap-1.5">
            {deduplicateMechanics(game.mechanics).map((mech) => (
              <MechanicTag key={mech} name={mech} variant="outline" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}