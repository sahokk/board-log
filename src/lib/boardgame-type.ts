export interface BoardgameTypeInput {
  entries: { gameId: string; sessionCount: number }[]
  games: {
    gameId: string
    weight: number | null
    categories: string | null
    mechanics: string | null
  }[]
}

export interface BoardgameType {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  weightScore: number  // 0-100: カジュアル → ストラテジー
  varietyScore: number // 0-100: 極め派 → 探索派
  socialScore: number  // 0-100: 競争派 → 協力/ソーシャル派
  themeScore: number   // 0-100: システム/ユーロ派 → テーマ派
}

// Heavy, strategic game signals
const HEAVY_SIGNALS = new Set([
  "Economic", "Wargames", "Political", "Industry / Manufacturing",
  "Worker Placement", "Engine Building", "Resource Management",
  "Route/Network Building", "Network and Route Building",
  "Deck Building", "Deck Construction", "Deck, Bag, and Pool Building",
  "Area Control", "Area Majority / Influence", "Auction/Bidding", "Bidding",
  "Variable Player Powers", "Action Points", "Tableau Building",
  "Hand Management", "Tile Placement", "Action Queue", "Civilization",
  "Abstract Strategy", "Negotiation",
])

// Light, casual game signals — weighted less aggressively (see LIGHT_WEIGHT below)
const LIGHT_SIGNALS = new Set([
  "Party Game", "Children's Game", "Children", "Animals",
  "Dice Rolling", "Push Your Luck", "Bluffing", "Voting",
  "Pattern Recognition", "Memory", "Speed", "Real-time",
  "Trivia", "Word Game", "Racing", "Roll / Spin and Move",
  "Humor", "Deduction", "Social Deduction",
])

// Light game signals count at 60% to avoid casual frequency of play inflating the "light" bias
const LIGHT_WEIGHT = 0.6

// Social/cooperative signals
const SOCIAL_SIGNALS = new Set([
  "Cooperative Game", "Team-Based Game", "Semi-Cooperative Game",
  "Social Deduction", "Bluffing", "Voting", "Party Game",
  "Role Playing", "Storytelling", "Acting",
])

// Competitive signals
const COMPETITIVE_SIGNALS = new Set([
  "Area Control", "Area Majority / Influence", "Auction/Bidding",
  "Player Elimination", "Elimination", "Negotiation",
  "Take That", "Trading",
])

// Thematic game signals (narrative, setting-driven)
const THEMATIC_SIGNALS = new Set([
  "Fantasy", "Science Fiction", "Adventure", "Horror", "Mythology",
  "Medieval", "Pirates", "Exploration", "Humor", "Animals",
  "Storytelling", "Role Playing", "Miniatures", "Campaign / Battle Card Driven",
  "Modular Board", "Variable Set-up",
])

// Abstract/euro game signals (system-driven)
const ABSTRACT_SIGNALS = new Set([
  "Abstract Strategy", "Economic", "Industry / Manufacturing",
  "Math", "Number", "Puzzle", "Pattern Building",
])

const TYPE_DEFINITIONS = [
  {
    id: "strategic-explorer",
    name: "戦略探検家",
    icon: "🏆",
    tagline: "重厚なゲームを次々と制覇",
    description:
      "複雑な戦略ゲームを広く探求するタイプ。新しい挑戦を求め、ゲームのルールや戦略を素早く習得する。ボードゲーム界の何でも屋。",
    weightAxis: "heavy",
    varietyAxis: "wide",
  },
  {
    id: "strategic-specialist",
    name: "戦略職人",
    icon: "⚔️",
    tagline: "極めし者の境地",
    description:
      "好みの重量級ゲームを何度も遊び込む職人タイプ。深い研究と緻密な戦略で他を圧倒する。そのゲームなら誰にも負けない。",
    weightAxis: "heavy",
    varietyAxis: "deep",
  },
  {
    id: "party-explorer",
    name: "パーティマスター",
    icon: "🎉",
    tagline: "楽しいゲームを広くコレクション",
    description:
      "カジュアルで盛り上がるゲームを幅広く楽しむタイプ。誰とでもすぐに打ち解け、場を盛り上げる才能がある。",
    weightAxis: "light",
    varietyAxis: "wide",
  },
  {
    id: "party-specialist",
    name: "推しゲーマー",
    icon: "💎",
    tagline: "お気に入りを何度でも",
    description:
      "気に入ったゲームを繰り返し楽しむタイプ。そのゲームの深みを誰よりも知っており、毎回新たな発見がある。",
    weightAxis: "light",
    varietyAxis: "deep",
  },
]

function scoreFromSignals(
  games: { categories: string | null; mechanics: string | null }[],
  positiveSet: Set<string>,
  negativeSet: Set<string>,
  negativeWeight = 1,
): number {
  let pos = 0
  let neg = 0
  let total = 0
  for (const g of games) {
    const tokens = [
      ...(g.categories?.split(",").map((s) => s.trim()) ?? []),
      ...(g.mechanics?.split(",").map((s) => s.trim()) ?? []),
    ]
    for (const t of tokens) {
      if (positiveSet.has(t)) pos++
      else if (negativeSet.has(t)) neg++
      total++
    }
  }
  if (total === 0) return 50
  const bias = (pos - neg * negativeWeight) / total
  return Math.round(Math.max(5, Math.min(95, 50 + bias * 150)))
}

export function calculateBoardgameType(data: BoardgameTypeInput): BoardgameType | null {
  const { entries, games } = data

  if (entries.length < 3) return null
  const totalSessions = entries.reduce((sum, e) => sum + e.sessionCount, 0)
  if (totalSessions < 5) return null

  const gameMap = new Map(games.map((g) => [g.gameId, g]))
  const gameList = entries.map((e) => gameMap.get(e.gameId)).filter(Boolean) as typeof games

  // --- Weight Score ---
  let weightScore = 50
  const gamesWithWeight = gameList.filter((g) => g.weight !== null)

  if (gamesWithWeight.length >= Math.floor(entries.length * 0.3)) {
    // Use actual BGG weight data (1.0 lightest → 5.0 heaviest)
    const avgWeight = gamesWithWeight.reduce((sum, g) => sum + (g.weight ?? 0), 0) / gamesWithWeight.length
    weightScore = Math.round(((avgWeight - 1) / 4) * 100)
  } else {
    // Infer from categories/mechanics; light signals count at LIGHT_WEIGHT to reduce casual play bias
    weightScore = scoreFromSignals(gameList, HEAVY_SIGNALS, LIGHT_SIGNALS, LIGHT_WEIGHT)
  }

  // --- Variety Score ---
  // Lower avg sessions/game = explorer; higher = specialist
  const avgSessionsPerGame = totalSessions / entries.length
  const varietyScore = Math.round(Math.max(5, Math.min(95, 105 - avgSessionsPerGame * 20)))

  // --- Social Score ---
  // Higher = cooperative/social; lower = competitive
  const socialScore = scoreFromSignals(gameList, SOCIAL_SIGNALS, COMPETITIVE_SIGNALS)

  // --- Theme Score ---
  // Higher = thematic/narrative; lower = abstract/euro/system
  const themeScore = scoreFromSignals(gameList, THEMATIC_SIGNALS, ABSTRACT_SIGNALS)

  // --- Determine type (based on primary axes: weight + variety) ---
  const isHeavy = weightScore >= 50
  const isWide = varietyScore >= 50

  const typeId = isHeavy
    ? isWide ? "strategic-explorer" : "strategic-specialist"
    : isWide ? "party-explorer" : "party-specialist"

  const typeDef = TYPE_DEFINITIONS.find((t) => t.id === typeId)!

  return {
    id: typeDef.id,
    name: typeDef.name,
    icon: typeDef.icon,
    tagline: typeDef.tagline,
    description: typeDef.description,
    weightScore,
    varietyScore,
    socialScore,
    themeScore,
  }
}
