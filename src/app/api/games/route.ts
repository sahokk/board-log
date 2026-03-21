import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const { name, imageUrl } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Game name is required" },
      { status: 400 }
    )
  }

  if (imageUrl?.trim()) {
    try {
      new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      )
    }
  }

  try {
    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ game }, { status: 201 })
  } catch (err) {
    console.error("Game creation error:", err)
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    )
  }
}
