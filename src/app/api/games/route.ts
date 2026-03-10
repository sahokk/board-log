import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, imageUrl } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Game name is required" },
      { status: 400 }
    )
  }

  try {
    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ game }, { status: 201 })
  } catch (error) {
    console.error("Game creation error:", error)
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    )
  }
}
