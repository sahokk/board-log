import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

type AuthSuccess = { userId: string; error: null }
type AuthFailure = { userId: null; error: NextResponse }

/**
 * Validates the current session and returns the userId, or a 401 response.
 *
 * Usage:
 *   const { userId, error } = await requireAuth()
 *   if (error) return error
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { userId: session.user.id, error: null }
}
