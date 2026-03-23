import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email, password } = await request.json() as { email: string; password: string }

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
  }

  // Check if Prisma user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
  }

  // Create Supabase auth user (stores password hash)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録済みです" }, { status: 409 })
    }
    return NextResponse.json({ error: "登録に失敗しました。もう一度お試しください" }, { status: 500 })
  }

  // Create Prisma user
  await prisma.user.create({
    data: {
      email: data.user.email ?? email,
      emailVerified: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
