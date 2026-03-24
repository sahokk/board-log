import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { CARD_THEMES } from "@/lib/card-themes"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  try {
    // Parse and validate request body
    const body = await request.json()
    const { displayName, customImageUrl, favoriteGenres, username } = body

    // Validate customImageUrl is a valid URL if provided
    if (customImageUrl?.trim()) {
      try {
        new URL(customImageUrl)
      } catch {
        return NextResponse.json(
          { error: "Invalid image URL format" },
          { status: 400 }
        )
      }
    }

    // Validate username format if provided
    const trimmedUsername = username?.trim() || null
    if (trimmedUsername) {
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmedUsername)) {
        return NextResponse.json(
          { error: "ユーザー名は3〜20文字の半角英数字・アンダースコア・ハイフンで入力してください" },
          { status: 400 }
        )
      }
      // Check uniqueness (excluding current user)
      const existing = await prisma.user.findFirst({
        where: { username: trimmedUsername, NOT: { id: userId } },
      })
      if (existing) {
        return NextResponse.json(
          { error: "このユーザー名はすでに使用されています" },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: trimmedUsername,
        displayName: displayName?.trim() || null,
        customImageUrl: customImageUrl?.trim() || null,
        favoriteGenres: favoriteGenres?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        customImageUrl: updatedUser.customImageUrl,
        favoriteGenres: updatedUser.favoriteGenres,
      },
    })
  } catch (err) {
    console.error("User update error:", err)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await request.json()

  if (typeof body.isProfilePublic === "boolean") {
    await prisma.user.update({
      where: { id: userId },
      data: { isProfilePublic: body.isProfilePublic },
    })
    return NextResponse.json({ success: true })
  }

  if (Array.isArray(body.featuredEntryIds)) {
    const ids = body.featuredEntryIds.slice(0, 3).filter((id: unknown) => typeof id === "string") as string[]
    // Verify all entry IDs belong to the current user
    if (ids.length > 0) {
      const ownedCount = await prisma.gameEntry.count({
        where: { id: { in: ids }, userId },
      })
      if (ownedCount !== ids.length) {
        return NextResponse.json({ error: "Invalid entry IDs" }, { status: 400 })
      }
    }
    await prisma.user.update({
      where: { id: userId },
      data: { featuredEntryIds: JSON.stringify(ids) },
    })
    return NextResponse.json({ success: true })
  }

  if (typeof body.cardTheme === "string") {
    if (!CARD_THEMES.some((t) => t.id === body.cardTheme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: userId },
      data: { cardTheme: body.cardTheme },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
        customImageUrl: true,
        favoriteGenres: true,
        name: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error("User fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const { userId, error } = await requireAuth()
  if (error) return error

  // Fetch email before deletion to remove Supabase auth user (Credentials login)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })

  // User の削除で Account/Session/GameEntry/WishlistItem/PlaySession が cascade 削除される
  await prisma.user.delete({ where: { id: userId } })

  // Also delete from Supabase so Credentials login cannot recreate this account
  if (user?.email) {
    let supabaseUserId: string | undefined
    let page = 1
    while (!supabaseUserId) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (!data?.users.length) break
      supabaseUserId = data.users.find((u) => u.email === user.email)?.id
      if (data.users.length < 1000) break
      page++
    }
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId)
    }
  }

  return NextResponse.json({ success: true })
}

