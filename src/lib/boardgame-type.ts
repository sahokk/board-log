// ============================================================
// Boardory 診断ロジック
// 設計書: document/診断ロジック設計.md
//
// 処理フロー:
//   mechanics → 中間カテゴリ → Boardoryスコア(5軸) → タイプ分類
// ============================================================

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
// タイプ定義（10種類、優先順位順）
// ============================================================
export const TYPE_DEFINITIONS = [
  {
    id: "pure-strategist",
    name: "純戦略マスター",
    icon: "🏰",
    tagline: "運に頼らず盤面を支配する",
    description:
      "運に頼らず、盤面を支配する職人タイプ。じっくり考えるゲームを好む。",
  },
  {
    id: "strategic-player",
    name: "対戦ストラテジスト",
    icon: "🧠",
    tagline: "対人戦で輝く思考型プレイヤー",
    description:
      "勝つために最適解を探し続ける思考型プレイヤー。対人戦でこそ真価を発揮する。",
  },
  {
    id: "engine-builder",
    name: "エンジンビルダー",
    icon: "📈",
    tagline: "効率化と構築に快感を覚える職人",
    description:
      "じわじわ強くなる構築型。長期的な成長と効率化に快感を覚える。",
  },
  {
    id: "negotiator",
    name: "駆け引きネゴシエーター",
    icon: "🤝",
    tagline: "交渉と読み合いで場を支配する",
    description:
      "交渉・心理戦・読み合いが大好物。人を動かして勝つタイプ。",
  },
  {
    id: "trickster",
    name: "心理戦トリックスター",
    icon: "🕵️",
    tagline: "嘘と読み合いで場をかき乱す",
    description:
      "嘘・ブラフ・読み合いを楽しむトリッキーなタイプ。相手の思考を崩すのが得意。",
  },
  {
    id: "party-maker",
    name: "盛り上げパーティメーカー",
    icon: "🎉",
    tagline: "いるだけで場が盛り上がる存在",
    description:
      "勝ち負けより場の楽しさ重視。その場にいるだけでゲームが盛り上がる存在。",
  },
  {
    id: "gambler",
    name: "ハイリスクギャンブラー",
    icon: "🎲",
    tagline: "運も実力のうち、一発逆転",
    description:
      "運も実力のうち。大きく勝つか、大きく負けるかを楽しむタイプ。",
  },
  {
    id: "speed-player",
    name: "スピードプレイヤー",
    icon: "⚡",
    tagline: "直感と判断力でテンポよく回す",
    description:
      "テンポ重視、サクサク進むゲームが好き。直感と判断力で場を回す。",
  },
  {
    id: "casual",
    name: "まったりカジュアル派",
    icon: "🧘",
    tagline: "重さより心地よさを大事に",
    description:
      "気軽に楽しく遊べればOK。重さよりも心地よさを大事にするタイプ。",
  },
  {
    id: "balanced",
    name: "バランスプレイヤー",
    icon: "🧩",
    tagline: "どんなゲームでも楽しめる万能型",
    description:
      "どんなゲームでも楽しめる万能型。場に合わせてプレイスタイルを変える柔軟さが強み。",
  },
]

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
// タイプ分類（優先順位順に判定）
// ============================================================

// 優先順位順。条件を満たした最初のエントリが採用される。
const TYPE_RULES: { id: string; match: (s: BoardgameScores) => boolean }[] = [
  { id: "pure-strategist",  match: (s) => s.strategy >= 75 && s.luck <= 30 && s.speed <= 40 },
  { id: "strategic-player", match: (s) => s.strategy >= 70 && s.interaction >= 50 && s.luck <= 40 },
  { id: "engine-builder",   match: (s) => s.strategy >= 65 && s.speed <= 40 && s.interaction <= 60 },
  { id: "negotiator",       match: (s) => s.interaction >= 70 && s.strategy >= 40 && s.party <= 60 },
  { id: "trickster",        match: (s) => s.interaction >= 65 && s.party >= 50 && s.strategy <= 60 },
  { id: "party-maker",      match: (s) => s.party >= 70 && s.interaction >= 50 },
  { id: "gambler",          match: (s) => s.luck >= 70 && s.strategy <= 50 },
  { id: "speed-player",     match: (s) => s.speed >= 70 && s.strategy <= 60 },
  { id: "casual",           match: (s) => s.luck >= 50 && s.party >= 50 && s.strategy <= 50 },
]

function determineType(scores: BoardgameScores): string {
  return TYPE_RULES.find((r) => r.match(scores))?.id ?? "balanced"
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
