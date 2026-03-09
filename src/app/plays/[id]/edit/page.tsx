import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EditClient } from "./EditClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPlayPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/plays")
  }

  const { id } = await params

  const play = await prisma.playRecord.findFirst({
    where: { id, userId: session.user.id },
    include: { game: true },
  })

  if (!play) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-lg px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">
          プレイ記録を編集
        </h1>
        <EditClient
          playId={play.id}
          game={{
            id: play.game.id,
            name: play.game.name,
            imageUrl: play.game.imageUrl,
          }}
          initialData={{
            playedAt: play.playedAt.toISOString().split("T")[0],
            rating: play.rating,
            memo: play.memo ?? "",
          }}
        />
      </div>
    </div>
  )
}
