import { prisma } from "@/lib/prisma"
import { getMechanicJaName } from "@/lib/bgg/mechanic-labels"
import { MECHANICS_MAP } from "@/lib/boardgame-type"
import { getBggGameDetails } from "@/lib/bgg/client"
import rawTypeRecommendations from "@/data/type-recommendations.json"

const TYPE_RECOMMENDATIONS = rawTypeRecommendations as Record<
  string,
  { bggId: string; nameEn: string; nameJa: string }[]
>

export interface TypeRecommendedGame {
  bggId: string
  nameEn: string
  nameJa: string
  id?: string
  imageUrl?: string | null
}

export async function getTypeRecommendedGames(typeId: string): Promise<TypeRecommendedGame[]> {
  const statics = TYPE_RECOMMENDATIONS[typeId] ?? []
  if (statics.length === 0) return []

  const bggIds = statics.map((g) => g.bggId)
  const dbGames = await prisma.game.findMany({
    where: { bggId: { in: bggIds } },
    select: { id: true, bggId: true, imageUrl: true },
  })

  const dbMap = new Map(dbGames.map((g) => [g.bggId, g]))

  // DBにないゲームはBGGから取得してupsert
  const missingBggIds = bggIds.filter((id) => !dbMap.has(id))
  if (missingBggIds.length > 0) {
    try {
      const details = await getBggGameDetails(missingBggIds)
      const upserted = await Promise.all(
        details.map((d) =>
          prisma.game.upsert({
            where: { bggId: d.id },
            update: { imageUrl: d.imageUrl ?? null },
            create: {
              bggId: d.id,
              name: d.name,
              nameJa: d.nameJa ?? null,
              imageUrl: d.imageUrl ?? null,
              categories: d.categories.length > 0 ? d.categories.join(",") : null,
              mechanics: d.mechanics.length > 0 ? d.mechanics.join("|") : null,
              weight: d.weight ?? null,
              playingTime: d.playingTime ?? null,
              minPlayers: d.minPlayers ?? null,
              maxPlayers: d.maxPlayers ?? null,
            },
            select: { id: true, bggId: true, imageUrl: true },
          })
        )
      )
      for (const g of upserted) {
        if (g.bggId) dbMap.set(g.bggId, g)
      }
    } catch {
      // BGG API不可でも静的データのみで返す
    }
  }

  return statics.map((s) => ({
    bggId: s.bggId,
    nameEn: s.nameEn,
    nameJa: s.nameJa,
    id: dbMap.get(s.bggId)?.id,
    imageUrl: dbMap.get(s.bggId)?.imageUrl,
  }))
}

export interface RecommendedGame {
  id: string
  name: string
  nameJa: string | null
  imageUrl: string | null
  categories: string | null
  playingTime: number | null
  wishlisted: boolean
  reason: string // おすすめ理由（日本語）
}

// ユーザーの好みを中間カテゴリの重みとして返す
function buildUserIntermediateProfile(
  entries: { game: { mechanics: string | null } }[],
): Map<string, number> {
  const profile = new Map<string, number>()
  for (const entry of entries) {
    const mechanics = entry.game.mechanics?.split("|").map((s) => s.trim()).filter(Boolean) ?? []
    for (const mechanic of mechanics) {
      const mapping = MECHANICS_MAP[mechanic]
      if (!mapping) continue
      for (const [cat, w] of Object.entries(mapping)) {
        profile.set(cat, (profile.get(cat) ?? 0) + w)
      }
    }
  }
  return profile
}

// ゲームの中間カテゴリプロフィールをユーザーのものと比較してスコアを返す
function scoreGameAgainstProfile(
  gameMechanics: string[],
  userProfile: Map<string, number>,
): number {
  let score = 0
  for (const mechanic of gameMechanics) {
    const mapping = MECHANICS_MAP[mechanic]
    if (!mapping) continue
    for (const [cat, w] of Object.entries(mapping)) {
      const userWeight = userProfile.get(cat) ?? 0
      score += userWeight * w
    }
  }
  return score
}

// ユーザーがよく使うメカニクス上位N件を返す（候補検索用）
function topMechanics(
  entries: { game: { mechanics: string | null } }[],
  limit: number,
): string[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    entry.game.mechanics?.split("|").forEach((m) => {
      const key = m.trim()
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

export async function getRecommendations(userId: string): Promise<RecommendedGame[]> {
  const [entries, wishlistItems] = await Promise.all([
    prisma.gameEntry.findMany({
      where: { userId },
      select: { gameId: true, game: { select: { mechanics: true } } },
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      select: { gameId: true },
    }),
  ])

  const playedGameIds = new Set(entries.map((e) => e.gameId))
  const wishlistedGameIds = new Set(wishlistItems.map((w) => w.gameId))
  const excludedIds = [...playedGameIds, ...wishlistedGameIds]

  const top = topMechanics(entries, 5)
  if (top.length === 0) return []

  // ユーザーの中間カテゴリプロフィールを構築
  const userProfile = buildUserIntermediateProfile(entries)

  // 上位メカニクスのいずれかを含む未プレイゲームを候補として取得
  const candidates = await prisma.game.findMany({
    where: {
      id: { notIn: excludedIds },
      imageUrl: { not: null },
      OR: [
        // 上位メカニクス
        ...top.map((m) => ({
          mechanics: { contains: m },
        })),
        // 中間カテゴリ（探索枠）
        ...Object.keys(userProfile).map((c) => ({
          mechanics: { contains: c },
        })),
      ],
    },
    take: 150,
  })

  const filtered = candidates.filter((game) => {
    const gameMechanics =
      game.mechanics?.split("|").map((s) => s.trim()).filter(Boolean) ?? []

    const matchCount = top.filter((m) =>
      gameMechanics.includes(m)
    ).length

    // 1つ以上一致に緩和
    return matchCount >= 1
  })

  const scored = filtered.map((game) => {
  const gameMechanics =
    game.mechanics?.split("|").map((s) => s.trim()).filter(Boolean) ?? []

    const matchCount = top.filter((m) =>
      gameMechanics.includes(m)
    ).length

    // 中間カテゴリ一致スコア
    const baseScore = scoreGameAgainstProfile(gameMechanics, userProfile)

    // 少し探索寄りに補正（一致が少ないほど微加点）
    const diversityBonus = 0.1 * (1 - matchCount / Math.max(top.length, 1))

    const score = baseScore + diversityBonus

    // おすすめ理由（複数化）
    const reasons = top
      .filter((m) => gameMechanics.includes(m))
      .slice(0, 2)
      .map((m) => `「${getMechanicJaName(m)}」`)
      .join("・")

    const reason = reasons ? `${reasons}好きにおすすめ` : ""

    return { game, score, reason }
  })

  const sorted = scored.toSorted((a, b) => b.score - a.score)

  // スコア帯分割
  const topTier = sorted.slice(0, 10)
  const midTier = sorted.slice(10, 50)
  const lowTier = sorted.slice(50, 100)

  // ランダム抽出関数
  const pickRandom = <T>(arr: T[], n: number): T[] => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, n)
  }

  // バランスよく混ぜる
  const mixed = [
    ...pickRandom(topTier, 4),
    ...pickRandom(midTier, 3),
    ...pickRandom(lowTier, 1),
  ]

  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[mixed[i], mixed[j]] = [mixed[j], mixed[i]]
  }

  return mixed
    .map(({ game, reason }) => ({
      id: game.id,
      name: game.name,
      nameJa: game.nameJa,
      imageUrl: game.imageUrl,
      categories: game.categories,
      playingTime: game.playingTime,
      wishlisted: false,
      reason,
    }))
}
