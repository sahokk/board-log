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
  weightScore: number  // 0-100, higher = heavier / more strategic
  varietyScore: number // 0-100, higher = more variety / explorer
}

// Category/mechanic keywords that signal heavier, more strategic games
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

// Category/mechanic keywords that signal lighter, more casual games
const LIGHT_SIGNALS = new Set([
  "Party Game", "Children's Game", "Children", "Animals",
  "Dice Rolling", "Push Your Luck", "Bluffing", "Voting",
  "Pattern Recognition", "Memory", "Speed", "Real-time",
  "Trivia", "Word Game", "Racing", "Roll / Spin and Move",
  "Humor", "Deduction", "Social Deduction",
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

export function calculateBoardgameType(data: BoardgameTypeInput): BoardgameType | null {
  const { entries, games } = data

  // Need enough data to make a meaningful determination
  if (entries.length < 3) return null
  const totalSessions = entries.reduce((sum, e) => sum + e.sessionCount, 0)
  if (totalSessions < 5) return null

  // --- Weight Score (0-100, higher = heavier) ---
  let weightScore = 50

  const gameMap = new Map(games.map((g) => [g.gameId, g]))

  // Collect entries that have weight data
  const gamesWithWeight = entries
    .map((e) => gameMap.get(e.gameId))
    .filter((g): g is NonNullable<typeof g> => g !== undefined && g.weight !== null)

  if (gamesWithWeight.length >= Math.floor(entries.length * 0.3)) {
    // Use actual weight data (BGG scale: 1.0 = lightest, 5.0 = heaviest; 3+ is considered heavy)
    const avgWeight =
      gamesWithWeight.reduce((sum, g) => sum + (g.weight ?? 0), 0) / gamesWithWeight.length
    weightScore = Math.round(((avgWeight - 1) / 4) * 100)
  } else {
    // Infer from categories/mechanics
    let heavyCount = 0
    let lightCount = 0
    let signalCount = 0
    for (const e of entries) {
      const g = gameMap.get(e.gameId)
      if (!g) continue
      const cats = g.categories?.split(",").map((s) => s.trim()) ?? []
      const mechs = g.mechanics?.split(",").map((s) => s.trim()) ?? []
      for (const s of [...cats, ...mechs]) {
        if (HEAVY_SIGNALS.has(s)) heavyCount++
        else if (LIGHT_SIGNALS.has(s)) lightCount++
        signalCount++
      }
    }
    if (signalCount > 0) {
      const bias = (heavyCount - lightCount) / signalCount
      weightScore = Math.round(Math.max(0, Math.min(100, 50 + bias * 150)))
    }
  }

  // --- Variety Score (0-100, higher = more variety / explorer) ---
  // avgSessionsPerGame: low = explorer, high = specialist
  const avgSessionsPerGame = totalSessions / entries.length
  // Score: 1 sess/game → ~95, 3 → ~60, 5 → ~30, 10+ → ~5
  const varietyScore = Math.round(Math.max(5, Math.min(95, 105 - avgSessionsPerGame * 20)))

  // --- Determine type ---
  const isHeavy = weightScore >= 50
  const isWide = varietyScore >= 50

  const typeId = isHeavy
    ? isWide
      ? "strategic-explorer"
      : "strategic-specialist"
    : isWide
      ? "party-explorer"
      : "party-specialist"

  const typeDef = TYPE_DEFINITIONS.find((t) => t.id === typeId)!

  return {
    id: typeDef.id,
    name: typeDef.name,
    icon: typeDef.icon,
    tagline: typeDef.tagline,
    description: typeDef.description,
    weightScore,
    varietyScore,
  }
}
