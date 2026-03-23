// ============================================================
// Boardory 診断ロジック
//
// 処理フロー:
//   mechanics → 中間カテゴリ → Boardoryスコア(5軸) → タイプ分類
//
// パラメータデータは src/data/ 以下の JSON で管理:
//   type-definitions.json  — 10種類のタイプ定義
//   mechanics-map.json     — BGGメカニクス → 中間カテゴリ変換テーブル
// ============================================================

import rawTypeDefinitions from "@/data/type-definitions.json"
import rawMechanicsMap from "@/data/mechanics-map.json"

export type BoardoryAxis = "strategy" | "luck" | "interaction" | "party" | "speed"

type IntermediateCategory =
  | "STRATEGY"
  | "LUCK"
  | "INTERACTION"
  | "PARTY"
  | "SPEED"
  | "ENGINE"
  | "SOCIAL"
  | "CONTROL"

export interface BoardgameScores {
  strategy: number    // 0-100: 戦略性
  luck: number        // 0-100: 運要素
  interaction: number // 0-100: 対人性
  party: number       // 0-100: 盛り上がり
  speed: number       // 0-100: テンポ
}

export interface BoardgameType {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  scores: BoardgameScores
}

export interface BoardgameTypeInput {
  entries: { gameId: string; sessionCount: number }[]
  games: {
    gameId: string
    weight: number | null
    categories: string | null
    mechanics: string | null
  }[]
}

// ============================================================
// データ (JSON から読み込み)
// ============================================================

export const TYPE_DEFINITIONS: Array<{
  id: string
  name: string
  icon: string
  tagline: string
  description: string
}> = rawTypeDefinitions

export const MECHANICS_MAP: Record<string, Partial<Record<IntermediateCategory, number>>> =
  rawMechanicsMap as Record<string, Partial<Record<IntermediateCategory, number>>>

// ============================================================
// 中間カテゴリ → Boardoryスコア変換テーブル
// ============================================================
const INTERMEDIATE_TO_BOARDORY: Record<IntermediateCategory, Partial<Record<BoardoryAxis, number>>> = {
  STRATEGY:    { strategy: 3 },
  ENGINE:      { strategy: 2, speed: -1 },
  LUCK:        { luck: 3 },
  INTERACTION: { interaction: 3 },
  SOCIAL:      { interaction: 2, party: 2 },
  PARTY:       { party: 3 },
  SPEED:       { speed: 3 },
  CONTROL:     { strategy: 2 },
}

// ============================================================
// タイプ分類（支配軸ファーストロジック）
//
// 正規化後に最大値が常に100になる特性を活かし、
// 「どの軸が支配的か」を最初に決定してからサブ分類する。
//
// balanced 判定:
//   上位3軸がすべて高い（secondScore>=65 && thirdScore>=45）場合、
//   特定のプレイスタイルに偏っていないとみなす。
//
// 各支配軸のサブ分類:
//   strategy → pure-strategist / strategic-player / engine-builder
//   interaction → trickster / negotiator
//   party → casual / party-maker / casual
//   luck → casual / gambler
//   speed → speed-player
// ============================================================

// ============================================================
// スコア計算
// ============================================================

function clamp100(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)))
}

function accumulateIntermediates(
  entries: BoardgameTypeInput["entries"],
  gameMap: Map<string, BoardgameTypeInput["games"][number]>,
) {
  const intermediateSum: Record<IntermediateCategory, number> = {
    STRATEGY: 0, LUCK: 0, INTERACTION: 0, PARTY: 0,
    SPEED: 0, ENGINE: 0, SOCIAL: 0, CONTROL: 0,
  }
  let totalSessions = 0
  let totalWeightedWeight = 0
  let totalWeightSessions = 0

  for (const entry of entries) {
    const game = gameMap.get(entry.gameId)
    if (!game) continue

    const { sessionCount } = entry
    totalSessions += sessionCount

    if (game.weight !== null) {
      totalWeightedWeight += game.weight * sessionCount
      totalWeightSessions += sessionCount
    }

    const mechanics = game.mechanics?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    for (const mechanic of mechanics) {
      const mapping = MECHANICS_MAP[mechanic]
      if (!mapping) continue
      for (const [cat, w] of Object.entries(mapping) as [IntermediateCategory, number][]) {
        intermediateSum[cat] += w * sessionCount
      }
    }
  }

  return { intermediateSum, totalSessions, totalWeightedWeight, totalWeightSessions }
}

function toRawScores(
  intermediateSum: Record<IntermediateCategory, number>,
  totalSessions: number,
  totalWeightedWeight: number,
  totalWeightSessions: number,
): Record<BoardoryAxis, number> {
  const rawScores: Record<BoardoryAxis, number> = {
    strategy: 0, luck: 0, interaction: 0, party: 0, speed: 0,
  }

  for (const [cat, axisMap] of Object.entries(INTERMEDIATE_TO_BOARDORY) as [IntermediateCategory, Partial<Record<BoardoryAxis, number>>][]) {
    const avg = totalSessions > 0 ? intermediateSum[cat] / totalSessions : 0
    for (const [axis, w] of Object.entries(axisMap) as [BoardoryAxis, number][]) {
      rawScores[axis] += avg * w
    }
  }

  // weight補正: avgWeight 1〜5 → strategy ±2, speed ∓2
  const avgWeight = totalWeightSessions > 0 ? totalWeightedWeight / totalWeightSessions : 3
  const weightNorm = (avgWeight - 1) / 4
  rawScores.strategy += weightNorm * 2
  rawScores.speed    -= weightNorm * 2

  return rawScores
}

function determineType(scores: BoardgameScores): string {
  // 全軸を降順ソート（最大値=100が先頭）
  const axes: [BoardoryAxis, number][] = [
    ["strategy",    scores.strategy],
    ["interaction", scores.interaction],
    ["party",       scores.party],
    ["luck",        scores.luck],
    ["speed",       scores.speed],
  ]
  const sorted = axes.toSorted((a, b) => b[1] - a[1])

  const primary    = sorted[0][0]
  const secondScore = sorted[1][1]
  const thirdScore  = sorted[2][1]

  // 上位3軸が均等なら balanced（特定スタイルへの偏りなし）
  if (secondScore >= 65 && thirdScore >= 45) return "balanced"

  switch (primary) {
    case "strategy":
      if (scores.luck <= 35 && scores.interaction <= 40) return "pure-strategist"
      if (scores.interaction >= 45) return "strategic-player"
      return "engine-builder"
    case "interaction":
      if (scores.party >= 45) return "trickster"
      return "negotiator"
    case "party":
      if (scores.luck >= 40) return "casual"
      if (scores.interaction >= 35) return "party-maker"
      return "casual"
    case "luck":
      if (scores.party >= 45) return "casual"
      return "gambler"
    case "speed":
      return "speed-player"
    default:
      return "balanced"
  }
}

function buildResult(typeId: string, scores: BoardgameScores): BoardgameType {
  const typeDef = TYPE_DEFINITIONS.find((t) => t.id === typeId) ?? TYPE_DEFINITIONS.at(-1)!
  return {
    id:          typeDef.id,
    name:        typeDef.name,
    icon:        typeDef.icon,
    tagline:     typeDef.tagline,
    description: typeDef.description,
    scores,
  }
}

export function calculateBoardgameType(data: BoardgameTypeInput): BoardgameType {
  const { entries, games } = data

  if (entries.length === 0) {
    return buildResult("balanced", { strategy: 20, luck: 20, interaction: 20, party: 20, speed: 20 })
  }

  const gameMap = new Map(games.map((g) => [g.gameId, g]))
  const { intermediateSum, totalSessions, totalWeightedWeight, totalWeightSessions } =
    accumulateIntermediates(entries, gameMap)

  const rawScores = toRawScores(intermediateSum, totalSessions, totalWeightedWeight, totalWeightSessions)

  const maxRaw = Math.max(...Object.values(rawScores), 0)
  const scale = maxRaw > 0 ? 100 / maxRaw : 1

  const scores: BoardgameScores = {
    strategy:    clamp100(rawScores.strategy    * scale),
    luck:        clamp100(rawScores.luck        * scale),
    interaction: clamp100(rawScores.interaction * scale),
    party:       clamp100(rawScores.party       * scale),
    speed:       clamp100(rawScores.speed       * scale),
  }

  return buildResult(determineType(scores), scores)
}
