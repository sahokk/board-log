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
    const { displayName, customImageUrl, favoriteGenres } = body

    // Validate customImageUrl is a valid URL if provided
    if (customImageUrl && customImageUrl.trim()) {
      try {
        new URL(customImageUrl)
      } catch {
        return NextResponse.json(
          { error: "Invalid image URL format" },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName?.trim() || null,
        customImageUrl: customImageUrl?.trim() || null,
        favoriteGenres: favoriteGenres?.trim() || null,
      },
    })

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
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
