import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignupClient } from "./SignupClient"

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user) redirect("/")

  const { callbackUrl } = await searchParams

  return (
    <div className="wood-texture flex min-h-screen items-center justify-center px-6 py-12">
      <SignupClient callbackUrl={callbackUrl ?? "/"} />
    </div>
  )
}
