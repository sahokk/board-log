import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SigninClient } from "./SigninClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ログイン | Boardory",
}

interface Props {
  readonly searchParams: Promise<{ callbackUrl?: string; error?: string }>
}

export default async function SigninPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user) redirect("/")

  const { callbackUrl, error } = await searchParams
  const safeCb = callbackUrl ?? "/"

  return (
    <div className="wood-texture flex min-h-screen items-center justify-center px-6 py-12">
      <SigninClient callbackUrl={safeCb} error={error} />
    </div>
  )
}
