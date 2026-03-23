// ============================================================
// Boardory 診断ロジック
//
// 処理フロー:
//   1. ゲームごとに mechanics → 中間カテゴリ → Boardoryスコア(5軸) を計算
//   2. ゲームの最高軸=100になるよう正規化（ゲームプロファイル）
//   3. sessionCount × ratingFactor で重み付けした加重平均を求める
//   4. 0-100の自然な比率としてプレイヤースコアになる
//   5. 支配軸ファーストロジックでタイプを分類
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
  entries: { gameId: string; sessionCount: number; rating?: number | null }[]
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

// BGGカテゴリ → Boardoryスコア変換テーブル（メカニクスが未知のゲーム向けフォールバック）
const CATEGORIES_AXIS: Partial<Record<string, Partial<Record<BoardoryAxis, number>>>> = {
  "Abstract Strategy": { strategy: 100 },
  "Party Game":        { party: 100 },
  "Children's Game":   { luck: 60, speed: 40 },
  "Economic":          { strategy: 70 },
  "Wargame":           { strategy: 60, interaction: 40 },
  "Negotiation":       { interaction: 80 },
  "Deduction":         { strategy: 50, interaction: 50 },
  "Dice":              { luck: 100 },
  "Real-time":         { speed: 100 },
  "Trivia":            { party: 70, luck: 30 },
  "Word Game":         { party: 80, speed: 20 },
}

// ============================================================
// ゲームプロファイル計算（ゲームごとの正規化）
// ============================================================

// メカニクスとウェイトからゲームの生スコアを計算
function computeGameRawAxes(
  mechanics: string[],
  weight: number | null,
): Record<BoardoryAxis, number> {
  const intermediateSum: Record<IntermediateCategory, number> = {
    STRATEGY: 0, LUCK: 0, INTERACTION: 0, PARTY: 0,
    SPEED: 0, ENGINE: 0, SOCIAL: 0, CONTROL: 0,
  }

  for (const mechanic of mechanics) {
    const mapping = MECHANICS_MAP[mechanic]
    if (!mapping) continue
    for (const [cat, w] of Object.entries(mapping) as [IntermediateCategory, number][]) {
      intermediateSum[cat] += w
    }
  }

  const raw: Record<BoardoryAxis, number> = {
    strategy: 0, luck: 0, interaction: 0, party: 0, speed: 0,
  }

  for (const [cat, axisMap] of Object.entries(INTERMEDIATE_TO_BOARDORY) as [IntermediateCategory, Partial<Record<BoardoryAxis, number>>][]) {
    const total = intermediateSum[cat]
    if (total === 0) continue
    for (const [axis, w] of Object.entries(axisMap) as [BoardoryAxis, number][]) {
      raw[axis] += total * w
    }
  }

  // weight補正: BGG重量 1〜5 → strategy増加・speed減少
  if (weight !== null) {
    const weightNorm = (weight - 1) / 4 // 0 (軽い) 〜 1 (重い)
    raw.strategy += weightNorm * 2
    raw.speed    -= weightNorm * 2
  }

  // 負値をクランプ
  for (const axis of Object.keys(raw) as BoardoryAxis[]) {
    if (raw[axis] < 0) raw[axis] = 0
  }

  return raw
}

// ゲームプロファイルを構築（最高軸=100に正規化、マッピング不可なら null）
function buildGameProfile(
  mechanics: string[],
  weight: number | null,
  categories: string[],
): Record<BoardoryAxis, number> | null {
  const raw = computeGameRawAxes(mechanics, weight)
  const maxRaw = Math.max(...Object.values(raw))

  if (maxRaw > 0) {
    const factor = 100 / maxRaw
    return {
      strategy:    Math.round(raw.strategy    * factor),
      luck:        Math.round(raw.luck        * factor),
      interaction: Math.round(raw.interaction * factor),
      party:       Math.round(raw.party       * factor),
      speed:       Math.round(raw.speed       * factor),
    }
  }

  // メカニクスが未知のゲームはカテゴリでフォールバック
  if (categories.length > 0) {
    const catRaw: Record<BoardoryAxis, number> = {
      strategy: 0, luck: 0, interaction: 0, party: 0, speed: 0,
    }
    for (const cat of categories) {
      const axisMap = CATEGORIES_AXIS[cat]
      if (!axisMap) continue
      for (const [axis, w] of Object.entries(axisMap) as [BoardoryAxis, number][]) {
        catRaw[axis] += w
      }
    }
    const maxCat = Math.max(...Object.values(catRaw))
    if (maxCat > 0) {
      const factor = 100 / maxCat
      return {
        strategy:    Math.round(catRaw.strategy    * factor),
        luck:        Math.round(catRaw.luck        * factor),
        interaction: Math.round(catRaw.interaction * factor),
        party:       Math.round(catRaw.party       * factor),
        speed:       Math.round(catRaw.speed       * factor),
      }
    }
  }

  return null // マッピング不可、スキップ
}

// ============================================================
// 評価による重み付けファクター
// ============================================================

function getRatingFactor(rating: number | null | undefined): number {
  if (!rating) return 1
  const factors: number[] = [0, 0.6, 0.8, 1, 1.2, 1.5]
  return factors[rating] ?? 1
}

// ============================================================
// タイプ分類（支配軸ファーストロジック）
//
// balanced 判定:
//   primaryScore < 30: 支配軸が弱く全体的に均衡
//   secondScore >= primaryScore * 0.75: 2位軸が近接し方向性が不明確
//
// 各支配軸のサブ分類:
//   strategy → pure-strategist / strategic-player / engine-builder
//   interaction → trickster / negotiator
//   party → casual / party-maker
//   luck → casual / gambler
//   speed → speed-player
// ============================================================

function subtypeForStrategy(scores: BoardgameScores, p: number): string {
  if (scores.luck <= p * 0.35 && scores.interaction <= p * 0.4) return "pure-strategist"
  if (scores.interaction >= p * 0.45) return "strategic-player"
  return "engine-builder"
}

function subtypeForParty(scores: BoardgameScores, p: number): string {
  if (scores.luck >= p * 0.4) return "casual"
  if (scores.interaction >= p * 0.35) return "party-maker"
  return "casual"
}

function determineType(scores: BoardgameScores): string {
  const axes: [BoardoryAxis, number][] = [
    ["strategy",    scores.strategy],
    ["interaction", scores.interaction],
    ["party",       scores.party],
    ["luck",        scores.luck],
    ["speed",       scores.speed],
  ]
  const sorted = axes.toSorted((a, b) => b[1] - a[1])

  const primary      = sorted[0][0]
  const primaryScore = sorted[0][1]
  const secondScore  = sorted[1][1]

  // 支配軸がない（均衡）→ balanced
  if (primaryScore < 30) return "balanced"

  // 2位軸が近接（混合プレイヤー）→ balanced
  if (secondScore >= primaryScore * 0.9) return "balanced"

  switch (primary) {
    case "strategy":    return subtypeForStrategy(scores, primaryScore)
    case "interaction": return scores.party >= primaryScore * 0.45 ? "trickster" : "negotiator"
    case "party":       return subtypeForParty(scores, primaryScore)
    case "luck":        return scores.party >= primaryScore * 0.45 ? "casual" : "gambler"
    case "speed":       return "speed-player"
    default:            return "balanced"
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

// ============================================================
// メイン関数
// ============================================================

export function calculateBoardgameType(data: BoardgameTypeInput): BoardgameType {
  const { entries, games } = data

  if (entries.length === 0) {
    return buildResult("balanced", { strategy: 20, luck: 20, interaction: 20, party: 20, speed: 20 })
  }

  const gameMap = new Map(games.map((g) => [g.gameId, g]))

  const axisSum: Record<BoardoryAxis, number> = {
    strategy: 0, luck: 0, interaction: 0, party: 0, speed: 0,
  }
  let totalWeight = 0

  for (const entry of entries) {
    const game = gameMap.get(entry.gameId)
    if (!game) continue

    const mechanics   = game.mechanics?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    const categories  = game.categories?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    const profile     = buildGameProfile(mechanics, game.weight, categories)
    if (!profile) continue

    const entryWeight = entry.sessionCount * getRatingFactor(entry.rating)

    for (const axis of Object.keys(axisSum) as BoardoryAxis[]) {
      axisSum[axis] += profile[axis] * entryWeight
    }
    totalWeight += entryWeight
  }

  // マッピング可能なゲームが1件もない場合
  if (totalWeight === 0) {
    return buildResult("balanced", { strategy: 20, luck: 20, interaction: 20, party: 20, speed: 20 })
  }

  const scores: BoardgameScores = {
    strategy:    Math.round(axisSum.strategy    / totalWeight),
    luck:        Math.round(axisSum.luck        / totalWeight),
    interaction: Math.round(axisSum.interaction / totalWeight),
    party:       Math.round(axisSum.party       / totalWeight),
    speed:       Math.round(axisSum.speed       / totalWeight),
  }

  return buildResult(determineType(scores), scores)
}
