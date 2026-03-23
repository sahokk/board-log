import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
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
  providers: [Google, GitHub, Discord],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      // Override with custom profile data if available
      const dbUser = user as typeof user & {
        customImageUrl?: string | null
        displayName?: string | null
      }
      if (dbUser.customImageUrl) {
        session.user.image = dbUser.customImageUrl
      }
      if (dbUser.displayName) {
        session.user.name = dbUser.displayName
      }
      return session
    },
  },
})
