import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getAdminSession() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (user?.role !== "ADMIN") return null
  return { userId: user.id }
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === "ADMIN"
}
