import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EditClient } from "./EditClient"

interface Props {
  readonly params: Promise<{ id: string }>
}

export default async function EditPlayPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/plays")
  }

  const { id } = await params

  const entry = await prisma.gameEntry.findFirst({
    where: { id, userId: session.user.id },
    include: { game: true },
  })

  if (!entry) notFound()

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-lg px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-amber-950">
          評価を編集
        </h1>
        <EditClient
          entryId={entry.id}
          game={{
            id: entry.game.id,
            name: entry.game.name,
            imageUrl: entry.game.imageUrl,
          }}
          initialRating={entry.rating}
        />
      </div>
    </div>
  )
}
