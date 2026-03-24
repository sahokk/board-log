import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./OnboardingClient"

export const metadata: Metadata = {
  title: "はじめて使う | Boardory",
}

interface Props {
  readonly searchParams: Promise<{ importGames?: string }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await auth()
  const { importGames } = await searchParams

  if (session?.user?.id) {
    const count = await prisma.gameEntry.count({ where: { userId: session.user.id } })
    // importGames がある場合はゲーム登録済みユーザーでも一括登録画面を表示
    if (count > 0 && !importGames) redirect("/plays")
  }

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">
        <OnboardingClient
          isLoggedIn={!!session?.user?.id}
          importGameIds={importGames ?? null}
        />
      </div>
    </div>
  )
}
