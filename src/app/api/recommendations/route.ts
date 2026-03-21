import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getBggHotGames, getBggGameDetails } from "@/lib/bgg/client"
import { NextResponse } from "next/server"

export interface RecommendedGame {
  id: string
  bggId?: string | null
  name: string
  nameJa?: string | null
  imageUrl?: string | null
  categories: string[]
  mechanics: string[]
  matchedTags: string[]  // マッチしたカテゴリ/メカニクス
  score: number
}

// GET /api/recommendations - プレイ傾向からおすすめゲームを取得
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ユーザーのプレイ済みゲームを取得
  const playedEntries = await prisma.gameEntry.findMany({
    where: { userId: session.user.id },
    include: { game: true },
  })

  if (playedEntries.length === 0) {
    return NextResponse.json({ recommendations: [], reason: "no_plays" })
  }

  // プレイ済みゲームのBGGIDセット
  const playedBggIds = new Set(
    playedEntries.map((e) => e.game.bggId).filter(Boolean) as string[]
  )
  const playedGameIds = new Set(playedEntries.map((e) => e.gameId))

  // カテゴリ・メカニクスの頻度を集計
  const tagFreq: Record<string, number> = {}
  for (const entry of playedEntries) {
    const cats = entry.game.categories?.split(",").map((c) => c.trim()).filter(Boolean) ?? []
    const mechs = entry.game.mechanics?.split(",").map((m) => m.trim()).filter(Boolean) ?? []
    for (const tag of [...cats, ...mechs]) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + 1
    }
  }

  // 上位タグ（最大10個）
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)

  if (topTags.length === 0) {
    return NextResponse.json({ recommendations: [], reason: "no_tags" })
  }

  // BGGホットゲームを取得
  let hotGames
  try {
    hotGames = await getBggHotGames()
  } catch {
    return NextResponse.json({ recommendations: [], reason: "bgg_error" })
  }

  // プレイ済みを除外
  const candidates = hotGames.filter((g) => !playedBggIds.has(g.id))

  if (candidates.length === 0) {
    return NextResponse.json({ recommendations: [], reason: "all_played" })
  }

  // ローカルDBにキャッシュされているゲームを確認
  const candidateBggIds = candidates.map((g) => g.id)
  const cachedGames = await prisma.game.findMany({
    where: { bggId: { in: candidateBggIds } },
  })
  const cachedMap = new Map(cachedGames.map((g) => [g.bggId!, g]))

  // キャッシュにないものをBGG APIから取得（最大20件）
  const uncachedIds = candidateBggIds.filter((id) => !cachedMap.has(id)).slice(0, 20)
  if (uncachedIds.length > 0) {
    try {
      const details = await getBggGameDetails(uncachedIds)
      // DBにupsert
      await Promise.all(
        details.map((d) =>
          prisma.game.upsert({
            where: { bggId: d.id },
            create: {
              bggId: d.id,
              name: d.name,
              nameJa: d.nameJa,
              imageUrl: d.imageUrl,
              categories: d.categories.join(","),
              mechanics: d.mechanics.join(","),
              weight: d.weight,
              playingTime: d.playingTime,
              minPlayers: d.minPlayers,
              maxPlayers: d.maxPlayers,
            },
            update: {
              name: d.name,
              nameJa: d.nameJa,
              imageUrl: d.imageUrl,
              categories: d.categories.join(","),
              mechanics: d.mechanics.join(","),
              weight: d.weight,
              playingTime: d.playingTime,
              minPlayers: d.minPlayers,
              maxPlayers: d.maxPlayers,
            },
          })
        )
      )
      // キャッシュマップを更新
      for (const d of details) {
        cachedMap.set(d.id, {
          id: d.id,
          bggId: d.id,
          name: d.name,
          nameJa: d.nameJa ?? null,
          imageUrl: d.imageUrl ?? null,
          categories: d.categories.join(","),
          mechanics: d.mechanics.join(","),
          weight: d.weight ?? null,
          playingTime: d.playingTime ?? null,
          minPlayers: d.minPlayers ?? null,
          maxPlayers: d.maxPlayers ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch {
      // BGG取得失敗はスキップ
    }
  }

  // スコアリング
  const scored: RecommendedGame[] = []
  for (const hot of candidates) {
    const game = cachedMap.get(hot.id)
    if (!game) continue
    if (playedGameIds.has(game.id)) continue

    const cats = game.categories?.split(",").map((c) => c.trim()).filter(Boolean) ?? []
    const mechs = game.mechanics?.split(",").map((m) => m.trim()).filter(Boolean) ?? []
    const gameTags = [...cats, ...mechs]

    const matchedTags = gameTags.filter((t) => topTags.includes(t))
    const score = matchedTags.reduce((sum, tag) => sum + (tagFreq[tag] ?? 0), 0)

    if (score > 0) {
      scored.push({
        id: game.id,
        bggId: game.bggId,
        name: game.name,
        nameJa: game.nameJa,
        imageUrl: game.imageUrl,
        categories: cats,
        mechanics: mechs,
        matchedTags,
        score,
      })
    }
  }

  // スコア順にソートして上位6件
  scored.sort((a, b) => b.score - a.score)
  const recommendations = scored.slice(0, 6)

  return NextResponse.json({ recommendations, topTags: topTags.slice(0, 3) })
}
