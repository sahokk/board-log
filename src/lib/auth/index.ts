import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"

// Workaround: @auth/prisma-adapter uses findUnique with compound unique keys,
// which fails with Prisma 7 driver adapters (@prisma/adapter-pg).
// Override affected methods to use findFirst instead.
const adapter: Adapter = {
  ...PrismaAdapter(prisma),
  async getUserByAccount(providerAccountId) {
    const account = await prisma.account.findFirst({
      where: providerAccountId,
      include: { user: true },
    })
    return (account?.user as import("next-auth/adapters").AdapterUser) ?? null
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
