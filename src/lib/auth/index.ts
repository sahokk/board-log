import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase/server"

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
  // Credentials provider requires JWT sessions
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
        if (error) {
          // Distinguish "email not confirmed" so the client can show a specific message
          if (error.message.toLowerCase().includes("email not confirmed")) {
            throw new Error("EmailNotConfirmed")
          }
          return null
        }
        if (!data.user) return null

        // Find or create Prisma user (created here on first login after email confirmation)
        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          user = await prisma.user.create({
            data: { email, emailVerified: new Date() },
          })
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      } else if (typeof token.id === "string") {
        // Verify the user still exists in DB (handles account deletion with active JWT)
        const exists = await prisma.user.findUnique({ where: { id: token.id }, select: { id: true } })
        if (!exists) return null
      }
      return token
    },
    async session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id
        // Fetch custom profile data so overrides are always fresh
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { customImageUrl: true, displayName: true },
        })
        if (dbUser?.customImageUrl) session.user.image = dbUser.customImageUrl
        if (dbUser?.displayName) session.user.name = dbUser.displayName
      }
      return session
    },
  },
})
