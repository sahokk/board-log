import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

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

  // Create Supabase auth user — email_confirm: false sends a confirmation email
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { displayName: trimmedDisplayName, username: trimmedUsername },
  })
  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
    }
    return NextResponse.json({ error: "登録に失敗しました。もう一度お試しください" }, { status: 500 })
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
