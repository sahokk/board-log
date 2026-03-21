import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  // Authenticate user
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
        where: { username: trimmedUsername, NOT: { id: session.user.id } },
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
      where: { id: session.user.id },
      data: {
        username: trimmedUsername,
        displayName: displayName?.trim() || null,
        customImageUrl: customImageUrl?.trim() || null,
        favoriteGenres: favoriteGenres?.trim() || null,
      },
    })

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        customImageUrl: updatedUser.customImageUrl,
        favoriteGenres: updatedUser.favoriteGenres,
      },
    })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Get current user profile data
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
