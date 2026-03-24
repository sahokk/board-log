import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

// Public client — auth.signUp() is the only method that actually sends confirmation emails
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const { email, password, displayName, username } = await request.json() as {
    email: string
    password: string
    displayName?: string
    username?: string
  }

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
  }

  const trimmedUsername = username?.trim() || null
  const trimmedDisplayName = displayName?.trim() || null

  if (trimmedUsername) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: "ユーザー名は3〜20文字の半角英数字・アンダースコア・ハイフンで入力してください" },
        { status: 400 }
      )
    }
    const existing = await prisma.user.findFirst({ where: { username: trimmedUsername } })
    if (existing) {
      return NextResponse.json({ error: "このユーザー名はすでに使用されています" }, { status: 409 })
    }
  }

  // Check if Prisma user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
  }

  // supabase.auth.signUp() sends the confirmation email (admin API does not)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  const { data, error } = await supabasePublic.auth.signUp({
    email,
    password,
    options: {
      data: { displayName: trimmedDisplayName, username: trimmedUsername },
      emailRedirectTo: `${baseUrl}/signin`,
    },
  })
  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
    }
    return NextResponse.json({ error: "登録に失敗しました。もう一度お試しください" }, { status: 500 })
  }

  if (!data.user) {
    return NextResponse.json({ error: "登録に失敗しました。もう一度お試しください" }, { status: 500 })
  }

  // Check if the email is already taken in Supabase (enumeration protection returns success)
  // If identities is empty, the email already existed in Supabase
  if (data.user.identities?.length === 0) {
    return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
  }

  // Create Prisma user (emailVerified is null until the user confirms their email)
  await prisma.user.create({
    data: {
      email: data.user.email ?? email,
      displayName: trimmedDisplayName,
      username: trimmedUsername,
    },
  })

  return NextResponse.json({ success: true })
}
