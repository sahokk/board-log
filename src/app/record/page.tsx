import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecordClient } from "./RecordClient"
import BackButton from "@/components/BackButton"

interface Props {
  readonly searchParams: Promise<{ gameId?: string }>
}

export default async function RecordPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/record")
  }

  const { gameId } = await searchParams

  const game = gameId
    ? await prisma.game.findUnique({ where: { id: gameId } })
    : null

  // 既存のGameEntryがあれば評価を引き継ぐ
  const existingEntry =
    game && session.user.id
      ? await prisma.gameEntry.findFirst({
          where: { userId: session.user.id, gameId: game.id },
        })
      : null

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-lg px-6">
        <BackButton />
        
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-amber-950">
          プレイを記録
        </h2>
        <RecordClient
          game={game ? { id: game.id, name: game.customNameJa ?? game.nameJa ?? game.name, imageUrl: game.imageUrl } : null}
          existingEntryId={existingEntry?.id ?? null}
          existingRating={existingEntry?.rating ?? null}
        />
      </div>
    </div>
  )
}
