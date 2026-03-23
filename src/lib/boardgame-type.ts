// ============================================================
// Boardory 診断ロジック（3軸システム）
//
// 3軸:
//   Depth       (深さ/複雑さ): 0=ライト ↔ 100=ヘビー
//   Competition (対戦性):      0=協力型 ↔ 100=ガチ対戦型
//   Chaos       (カオス度):    0=戦略型 ↔ 100=運ゲー型
//
// 処理フロー:
//   1. ゲームごとに BGGメカニクス → 中間カテゴリ → 3軸スコアを計算
//   2. BGG weight が Depth の主成分、メカニクスで補完
//   3. sessionCount × ratingFactor で重み付けした加重平均
//   4. 10タイプのいずれかに分類
//
// パラメータデータは src/data/ 以下の JSON で管理:
//   type-definitions.json  — 10タイプ定義
//   mechanics-map.json     — BGGメカニクス → 中間カテゴリ変換テーブル
// ============================================================

import rawTypeDefinitions from "@/data/type-definitions.json"
import rawMechanicsMap from "@/data/mechanics-map.json"

export type BoardoryAxis = "depth" | "competition" | "chaos"

type IntermediateCategory =
  | "STRATEGY"
  | "LUCK"
  | "INTERACTION"
  | "PARTY"
  | "SPEED"
  | "ENGINE"
  | "SOCIAL"
  | "CONTROL"
  | "COOP"

export interface BoardgameScores {
  depth: number       // 0-100: ゲームの重さ・複雑さ
  competition: number // 0-100: 対戦性（低=協力、高=ガチ対戦）
  chaos: number       // 0-100: カオス度（低=戦略、高=運要素）
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
// 中間カテゴリ → 3軸変換テーブル
//
// 各値は「軸への影響度」。正 = 軸を押し上げる、負 = 押し下げる。
// スケール係数 SCALE = 4 を掛けてからベースライン50に加算する。
// ============================================================
const INTERMEDIATE_TO_3AXES: Record<IntermediateCategory, { depth: number; competition: number; chaos: number }> = {
  STRATEGY:    { depth: +2, competition:  0, chaos: -2 },
  ENGINE:      { depth: +3, competition:  0, chaos: -1 },
  LUCK:        { depth:  0, competition:  0, chaos: +3 },
  INTERACTION: { depth:  0, competition: +3, chaos:  0 },
  SOCIAL:      { depth:  0, competition: +1, chaos:  0 }, // ブラフ・社会的推理 = やや対戦的
  COOP:        { depth:  0, competition: -3, chaos:  0 }, // 協力ゲーム = 対戦性を下げる
  PARTY:       { depth:  0, competition:  0, chaos: +1 },
  SPEED:       { depth: -2, competition:  0, chaos:  0 },
  CONTROL:     { depth: +1, competition:  0, chaos: -1 },
}

const AXIS_SCALE = 4 // 生スコアに掛けるスケール係数

// カテゴリ → 3軸フォールバック（メカニクスが未知のゲーム向け）
const CATEGORIES_3AXES: Partial<Record<string, { depth: number; competition: number; chaos: number }>> = {
  "Abstract Strategy": { depth: 60, competition: 60, chaos: 10 },
  "Party Game":        { depth: 10, competition: 50, chaos: 60 },
  "Children's Game":   { depth:  5, competition: 50, chaos: 65 },
  "Economic":          { depth: 60, competition: 65, chaos: 30 },
  "Wargame":           { depth: 70, competition: 80, chaos: 30 },
  "Deduction":         { depth: 45, competition: 65, chaos: 25 },
  "Dice":              { depth: 15, competition: 50, chaos: 85 },
  "Real-time":         { depth: 10, competition: 50, chaos: 45 },
  "Trivia":            { depth: 15, competition: 55, chaos: 55 },
  "Word Game":         { depth: 10, competition: 50, chaos: 55 },
  "Cooperative":       { depth: 40, competition: 15, chaos: 45 },
}

// ============================================================
// ゲームプロファイル計算
// ============================================================

function clamp(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)))
}

// メカニクスと weight から 3軸スコアを計算（ゲーム1本分）
function computeGame3Axes(
  mechanics: string[],
  weight: number | null,
): { depth: number; competition: number; chaos: number } | null {
  const intermediateSum: Record<IntermediateCategory, number> = {
    STRATEGY: 0, LUCK: 0, INTERACTION: 0, PARTY: 0,
    SPEED: 0, ENGINE: 0, SOCIAL: 0, CONTROL: 0, COOP: 0,
  }

  let hasMapped = false
  for (const mechanic of mechanics) {
    const mapping = MECHANICS_MAP[mechanic]
    if (!mapping) continue
    hasMapped = true
    for (const [cat, w] of Object.entries(mapping) as [IntermediateCategory, number][]) {
      intermediateSum[cat] += w
    }
  }

  if (!hasMapped && weight === null) return null

  // 各軸の生の貢献値を集計
  let depthContrib = 0, competitionContrib = 0, chaosContrib = 0
  for (const [cat, total] of Object.entries(intermediateSum) as [IntermediateCategory, number][]) {
    if (total === 0) continue
    const axes = INTERMEDIATE_TO_3AXES[cat]
    depthContrib       += axes.depth       * total
    competitionContrib += axes.competition * total
    chaosContrib       += axes.chaos       * total
  }

  // Depth: weight が主成分。メカニクスが補完
  const mechDepth = clamp(50 + depthContrib * AXIS_SCALE)
  const depth = weight === null
    ? mechDepth
    : clamp((weight - 1) / 4 * 100 * 0.7 + mechDepth * 0.3)

  const competition = clamp(50 + competitionContrib * AXIS_SCALE)
  const chaos       = clamp(50 + chaosContrib       * AXIS_SCALE)

  return { depth, competition, chaos }
}

// ゲームプロファイルを構築（カテゴリフォールバック付き）
function buildGameProfile(
  mechanics: string[],
  weight: number | null,
  categories: string[],
): { depth: number; competition: number; chaos: number } | null {
  const result = computeGame3Axes(mechanics, weight)
  if (result) return result

  // メカニクス未マッピングの場合: カテゴリでフォールバック
  if (categories.length === 0) return null

  let depth = 0, competition = 0, chaos = 0
  let count = 0
  for (const cat of categories) {
    const axes = CATEGORIES_3AXES[cat]
    if (!axes) continue
    depth       += axes.depth
    competition += axes.competition
    chaos       += axes.chaos
    count++
  }
  if (count === 0) return null

  return {
    depth:       clamp(depth / count),
    competition: clamp(competition / count),
    chaos:       clamp(chaos / count),
  }
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
// タイプ分類（10タイプ、優先度順に判定）
//
// 分類ルール（先にマッチしたものが採用される）:
//   1. cooperative   : competition ≤ 28（強い協力）
//   2. gambler       : chaos ≥ 72（強い運要素）
//   3. heavy-strategist: depth ≥ 60 + competition ≥ 55 + chaos ≤ 42
//   4. engine-builder: depth ≥ 60 + chaos ≤ 42
//   5. negotiator    : competition ≥ 68 + chaos ≤ 45
//   6. strategic-player: depth ≥ 45 + competition ≥ 60 + chaos ≤ 45
//   7. trickster     : competition ≥ 62
//   8. party-master  : depth ≤ 40 + chaos ≥ 38
//   9. casual        : depth ≤ 45 + chaos ≤ 55
//  10. balanced      : 上記に当てはまらない（万能型）
// ============================================================

function determineType(scores: BoardgameScores): string {
  const { depth, competition, chaos } = scores

  if (competition <= 28) return "cooperative"
  if (chaos >= 72)       return "gambler"

  if (depth >= 60 && competition >= 55 && chaos <= 42) return "heavy-strategist"
  if (depth >= 60 && chaos <= 42)                      return "engine-builder"

  if (competition >= 68 && chaos <= 45)                return "negotiator"
  if (depth >= 45 && competition >= 60 && chaos <= 45) return "strategic-player"
  if (competition >= 62)                               return "trickster"

  if (depth <= 40 && chaos >= 38) return "party-master"
  if (depth <= 45 && chaos <= 55) return "casual"

  return "balanced"
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
    return buildResult("balanced", { depth: 33, competition: 50, chaos: 50 })
  }

  const gameMap = new Map(games.map((g) => [g.gameId, g]))

  const axisSum = { depth: 0, competition: 0, chaos: 0 }
  let totalWeight = 0

  for (const entry of entries) {
    const game = gameMap.get(entry.gameId)
    if (!game) continue

    const mechanics  = game.mechanics?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    const categories = game.categories?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    const profile    = buildGameProfile(mechanics, game.weight, categories)
    if (!profile) continue

    const entryWeight = entry.sessionCount * getRatingFactor(entry.rating)

    axisSum.depth       += profile.depth       * entryWeight
    axisSum.competition += profile.competition * entryWeight
    axisSum.chaos       += profile.chaos       * entryWeight
    totalWeight         += entryWeight
  }

  if (totalWeight === 0) {
    return buildResult("balanced", { depth: 33, competition: 50, chaos: 50 })
  }

  const scores: BoardgameScores = {
    depth:       Math.round(axisSum.depth       / totalWeight),
    competition: Math.round(axisSum.competition / totalWeight),
    chaos:       Math.round(axisSum.chaos       / totalWeight),
  }

  return buildResult(determineType(scores), scores)
}
