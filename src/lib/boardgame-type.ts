// ============================================================
// Boardory 診断ロジック
// 設計書: document/診断ロジック設計.md
//
// 処理フロー:
//   mechanics → 中間カテゴリ → Boardoryスコア(5軸) → タイプ分類
// ============================================================

import type { IconType } from "react-icons"
import { GiChessPawn, GiCrossedSwords, GiScales, GiDiceSixFacesFive } from "react-icons/gi"
import { MdCelebration } from "react-icons/md"

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
  icon: IconType
  tagline: string
  description: string
  scores: BoardgameScores
  subType: string
  subTypeId: string
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
// mechanics → 中間カテゴリ変換テーブル
// スコアは相対値（1〜3）で管理、1 mechanic = 複数カテゴリへの加算可
// ============================================================
export const MECHANICS_MAP: Record<string, Partial<Record<IntermediateCategory, number>>> = {
  // --- 戦略・思考系 ---
  "Worker Placement":              { STRATEGY: 3 },
  "Action Points":                 { STRATEGY: 2 },
  "Action Queue":                  { STRATEGY: 2 },
  "Tech Trees / Tech Tracks":      { STRATEGY: 3, ENGINE: 1 },
  "Area Movement":                 { STRATEGY: 2, INTERACTION: 1 },
  "Point to Point Movement":       { STRATEGY: 1 },
  "Hexagon Grid":                  { STRATEGY: 2 },
  "Abstract Strategy":             { STRATEGY: 3 },
  "Deduction":                     { STRATEGY: 2 },
  "Campaign / Battle Card Driven": { STRATEGY: 2, INTERACTION: 2 },
  "Grid Movement":                 { STRATEGY: 1 },
  "Simultaneous Action Selection": { STRATEGY: 1, SPEED: 1, INTERACTION: 1 },
  "Variable Player Powers":        { STRATEGY: 2 },
  "Modular Board":                 { STRATEGY: 1 },
  "Tile Placement":                { STRATEGY: 2 },
  "Pattern Building":              { STRATEGY: 2 },
  "Force Commitment":              { STRATEGY: 1, INTERACTION: 1 },
  "Catch the Leader":              { INTERACTION: 2 },
  "Induction":                     { STRATEGY: 1 },
  "Map Addition":                  { STRATEGY: 1 },
  "Map Reduction":                 { STRATEGY: 1 },
  "Minimap Resolution":            { STRATEGY: 1 },
  "Move Through Deck":             { STRATEGY: 1 },
  "Once-Per-Game Abilities":       { STRATEGY: 1 },
  "Order Counters":                { STRATEGY: 1 },
  "Rock-Paper-Scissors":           { LUCK: 1, PARTY: 1 },

  // --- エンジン構築・リソース管理系 ---
  "Deck Building":                 { ENGINE: 3 },
  "Deck, Bag, and Pool Building":  { ENGINE: 3 },
  "Engine Building":               { ENGINE: 3 },
  "Tableau Building":              { ENGINE: 2, CONTROL: 1 },
  "Resource Management":           { CONTROL: 3 },
  "Hand Management":               { CONTROL: 2, STRATEGY: 1 },
  "Set Collection":                { CONTROL: 2 },
  "Pickup and Deliver":            { CONTROL: 2, STRATEGY: 1 },
  "Market":                        { CONTROL: 2, STRATEGY: 1 },
  "Route/Network Building":        { STRATEGY: 2, CONTROL: 1 },
  "Network and Route Building":    { STRATEGY: 2, CONTROL: 1 },
  "Enclosure":                     { CONTROL: 2 },
  "Bag Building":                  { ENGINE: 2 },
  "Income":                        { CONTROL: 2 },
  "Contracts":                     { CONTROL: 1, STRATEGY: 1 },
  "Loans":                         { CONTROL: 1, STRATEGY: 1 },
  "Deck Construction":             { ENGINE: 2, LUCK: 1 },

  // --- 対人・インタラクション系 ---
  "Area Control":                  { INTERACTION: 3 },
  "Area Majority / Influence":     { INTERACTION: 3 },
  "Negotiation":                   { INTERACTION: 3, SOCIAL: 1 },
  "Take That":                     { INTERACTION: 3 },
  "Player Elimination":            { INTERACTION: 2 },
  "Auction/Bidding":               { INTERACTION: 2, CONTROL: 2 },
  "Bidding":                       { INTERACTION: 2, CONTROL: 1 },
  "Trading":                       { INTERACTION: 2, CONTROL: 1 },
  "Voting":                        { INTERACTION: 2, SOCIAL: 2 },
  "Drafting":                      { INTERACTION: 1, STRATEGY: 2 },
  "Card Drafting":                 { INTERACTION: 1, STRATEGY: 2 },
  "Hidden Movement":               { INTERACTION: 2, SOCIAL: 1 },
  "Prisoner's Dilemma":            { INTERACTION: 2, SOCIAL: 1 },

  // --- ソーシャル・協力系 ---
  "Cooperative Game":              { SOCIAL: 3 },
  "Semi-Cooperative Game":         { SOCIAL: 2, INTERACTION: 1 },
  "Team-Based Game":               { SOCIAL: 3 },
  "Social Deduction":              { SOCIAL: 3, INTERACTION: 1 },
  "Bluffing":                      { SOCIAL: 3 },
  "Hidden Roles":                  { SOCIAL: 3, INTERACTION: 1 },
  "Role Playing":                  { SOCIAL: 3, PARTY: 2 },
  "Storytelling":                  { SOCIAL: 2, PARTY: 2 },
  "Acting":                        { PARTY: 3, SOCIAL: 1 },
  "Communication Limits":          { SOCIAL: 2 },

  // --- パーティ・盛り上がり系 ---
  "Trivia":                        { PARTY: 2, LUCK: 1 },
  "Word Game":                     { PARTY: 2, SPEED: 1 },
  "Physical":                      { PARTY: 3, SPEED: 2 },
  "Paper-and-Pencil":              { PARTY: 1 },
  "Humor":                         { PARTY: 2 },

  // --- スピード・リアルタイム系 ---
  "Real-Time":                     { SPEED: 3 },
  "Speed Matching":                { SPEED: 3 },
  "Pattern Recognition":           { SPEED: 2 },
  "Memory":                        { SPEED: 1, LUCK: 1 },

  // --- 運・ランダム系 ---
  "Dice Rolling":                  { LUCK: 3 },
  "Push Your Luck":                { LUCK: 3 },
  "Roll / Spin and Move":          { LUCK: 2, SPEED: 1 },
  "Random Production":             { LUCK: 2 },
  "Chit-Pull System":              { LUCK: 2 },
}

// ============================================================
// 中間カテゴリ → Boardoryスコア変換テーブル（設計書 5.2）
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
// タイプ定義（設計書 9）
// ============================================================
export const TYPE_DEFINITIONS = [
  {
    id: "strategist",
    name: "ストラテジスト",
    icon: GiChessPawn,
    tagline: "思考の果てに勝利をつかむ",
    description:
      "複雑なルールと長期戦略を楽しむタイプ。ゲームを深く分析し、最適解を追い求める。重量級ゲームをこよなく愛す本格派ゲーマー。",
    dominantAxis: "strategy" as BoardoryAxis | null,
  },
  {
    id: "interactor",
    name: "インタラクター",
    icon: GiCrossedSwords,
    tagline: "対人戦の醍醐味を知る者",
    description:
      "他プレイヤーとの駆け引きや交渉を楽しむタイプ。エリアコントロールや交渉ゲームで本領を発揮し、対戦相手との読み合いに興奮する。",
    dominantAxis: "interaction" as BoardoryAxis | null,
  },
  {
    id: "party-maker",
    name: "パーティメーカー",
    icon: MdCelebration,
    tagline: "みんなを笑顔にする天才",
    description:
      "盛り上がりと楽しい雰囲気を最優先するタイプ。パーティゲームや大人数ゲームが大好きで、場の空気を最高にする才能がある。",
    dominantAxis: "party" as BoardoryAxis | null,
  },
  {
    id: "casual",
    name: "カジュアル",
    icon: GiDiceSixFacesFive,
    tagline: "気軽にサクッと楽しみたい",
    description:
      "ルールが簡単でテンポのよいゲームを好むタイプ。運要素やスピード感のあるゲームで楽しさを見つける。気軽に誰とでも遊べる親しみやすさが魅力。",
    dominantAxis: null,
  },
  {
    id: "balanced",
    name: "バランス型",
    icon: GiScales,
    tagline: "オールラウンドなゲーマー",
    description:
      "特定のスタイルにこだわらず、あらゆるゲームを楽しめるタイプ。戦略もパーティも協力ゲームも全部こなせる万能プレイヤー。",
    dominantAxis: null,
  },
]

// ============================================================
// サブタイプ定義（設計書 9.2）
// [メインタイプID][2番目に高い軸] → サブタイプ名
// ============================================================
const SUB_TYPE_MAP: Record<string, Record<BoardoryAxis, string>> = {
  strategist: {
    strategy:    "ピュアストラテジスト",
    interaction: "対戦ストラテジスト",
    party:       "社交ストラテジスト",
    luck:        "博打ストラテジスト",
    speed:       "速攻ストラテジスト",
  },
  interactor: {
    strategy:    "戦略インタラクター",
    interaction: "ガチンコインタラクター",
    party:       "社交インタラクター",
    luck:        "ギャンブルインタラクター",
    speed:       "機動インタラクター",
  },
  "party-maker": {
    strategy:    "知略パーティメーカー",
    interaction: "競争パーティメーカー",
    party:       "盛り上げ屋",
    luck:        "ラッキーパーティメーカー",
    speed:       "爆速パーティメーカー",
  },
  casual: {
    strategy:    "頭脳派カジュアル",
    interaction: "社交派カジュアル",
    party:       "パーティ派カジュアル",
    luck:        "ラッキーカジュアル",
    speed:       "スピード派カジュアル",
  },
  balanced: {
    strategy:    "バランス型",
    interaction: "バランス型",
    party:       "バランス型",
    luck:        "バランス型",
    speed:       "バランス型",
  },
}

// ============================================================
// スコア計算（設計書 8）
// ============================================================

// rawスコアを 0-100 にクランプして丸める
function clamp100(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)))
}

// エントリ群から中間カテゴリの加重合計とweight情報を集計する
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

// 中間カテゴリ → Boardory 5軸スコア（rawスコア）に変換する
function toRawScores(
  intermediateSum: Record<IntermediateCategory, number>,
  totalSessions: number,
  totalWeightedWeight: number,
  totalWeightSessions: number,
): Record<BoardoryAxis, number> {
  const rawScores: Record<BoardoryAxis, number> = {
    strategy: 0, luck: 0, interaction: 0, party: 0, speed: 0,
  }

  // セッション平均の中間カテゴリスコアを各軸に加算
  for (const [cat, axisMap] of Object.entries(INTERMEDIATE_TO_BOARDORY) as [IntermediateCategory, Partial<Record<BoardoryAxis, number>>][]) {
    const avg = totalSessions > 0 ? intermediateSum[cat] / totalSessions : 0
    for (const [axis, w] of Object.entries(axisMap) as [BoardoryAxis, number][]) {
      rawScores[axis] += avg * w
    }
  }

  // weight補正（設計書 6）: strategy += weight×2, speed -= weight×2
  const avgWeight = totalWeightSessions > 0 ? totalWeightedWeight / totalWeightSessions : 3
  const weightNorm = (avgWeight - 1) / 4  // 0.0(最軽) 〜 1.0(最重)
  rawScores.strategy += weightNorm * 2
  rawScores.speed    -= weightNorm * 2

  return rawScores
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

  // rawScoreの最大値を基準にスケール。最大値が低すぎる場合は固定スケール(×7)を使用
  const maxRaw = Math.max(...Object.values(rawScores), 0)
  const scale = maxRaw > 14 ? 100 / maxRaw : 7

  const scores: BoardgameScores = {
    strategy:    clamp100(rawScores.strategy    * scale),
    luck:        clamp100(rawScores.luck        * scale),
    interaction: clamp100(rawScores.interaction * scale),
    party:       clamp100(rawScores.party       * scale),
    speed:       clamp100(rawScores.speed       * scale),
  }

  return buildResult(determineType(scores), scores)
}

// ============================================================
// タイプ分類（設計書 9）
// ============================================================

function determineType(scores: BoardgameScores): string {
  const { strategy, luck, interaction, party, speed } = scores

  // バランス型: 全軸が均等（最大 - 最小 < 20）
  const max = Math.max(strategy, luck, interaction, party, speed)
  const min = Math.min(strategy, luck, interaction, party, speed)
  if (max - min < 20) return "balanced"

  // カジュアル: luck + speed が他軸より高い
  const casualScore = (luck + speed) / 2
  if (casualScore > strategy && casualScore > interaction && casualScore > party) {
    return "casual"
  }

  // その他: strategy / interaction / party の最大軸
  const contenders: [string, number][] = [
    ["strategist",  strategy],
    ["interactor",  interaction],
    ["party-maker", party],
  ]
  contenders.sort((a, b) => b[1] - a[1])
  return contenders[0][0]
}

function buildResult(typeId: string, scores: BoardgameScores): BoardgameType {
  const typeDef = TYPE_DEFINITIONS.find((t) => t.id === typeId) ?? TYPE_DEFINITIONS[4] // fallback: balanced

  // サブタイプ: 2番目に高い軸で決定
  const axisList: [BoardoryAxis, number][] = [
    ["strategy",    scores.strategy],
    ["luck",        scores.luck],
    ["interaction", scores.interaction],
    ["party",       scores.party],
    ["speed",       scores.speed],
  ]
  axisList.sort((a, b) => b[1] - a[1])

  // メインタイプが casual/balanced の場合は1位の軸、それ以外は2位の軸
  const secondAxis = axisList.length > 1 ? axisList[1][0] : axisList[0][0]
  const subTypeRow = SUB_TYPE_MAP[typeId] ?? SUB_TYPE_MAP["balanced"]
  const subType = subTypeRow[secondAxis]
  const subTypeId = `${typeId}-${secondAxis}`

  return {
    id:          typeDef.id,
    name:        typeDef.name,
    icon:        typeDef.icon,
    tagline:     typeDef.tagline,
    description: typeDef.description,
    scores,
    subType,
    subTypeId,
  }
}
