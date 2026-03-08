import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecordClient } from "./RecordClient"

interface Props {
  searchParams: Promise<{ gameId?: string }>
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

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">プレイを記録</h1>
      <RecordClient
        game={
          game
            ? { id: game.id, name: game.name, imageUrl: game.imageUrl }
            : null
        }
      />
    </div>
  )
}
