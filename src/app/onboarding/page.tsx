import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./OnboardingClient"

export const metadata: Metadata = {
  title: "はじめて使う | Boardory",
}

export default async function OnboardingPage() {
  const session = await auth()

  if (session?.user?.id) {
    const count = await prisma.gameEntry.count({ where: { userId: session.user.id } })
    if (count > 0) redirect("/plays")
  }

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-6">
        <OnboardingClient isLoggedIn={!!session?.user?.id} />
      </div>
    </div>
  )
}
