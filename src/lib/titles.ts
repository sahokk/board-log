export interface Title {
  id: string
  name: string
  description: string
  icon: string
}

export interface TitleWithUnlocked extends Title {
  unlocked: boolean
}

interface PlayData {
  playedAt: Date
  gameId: string
  rating: number
}

interface TitleDefinition extends Title {
  check: (stats: TitleStats) => boolean
}

interface TitleStats {
  totalPlays: number
  uniqueGames: number
  averageRating: number
  maxSameGame: number
  fiveStarCount: number
  maxConsecutiveDays: number
}

const TITLES: TitleDefinition[] = [
  // プレイ数系
  {
    id: "first-step",
    name: "はじめの一歩",
    description: "はじめてプレイを記録した",
    icon: "👣",
    check: (s) => s.totalPlays >= 1,
  },
  {
    id: "apprentice",
    name: "ボドゲ見習い",
    description: "10回プレイを記録した",
    icon: "🎲",
    check: (s) => s.totalPlays >= 10,
  },
  {
    id: "regular",
    name: "テーブルの常連",
    description: "50回プレイを記録した",
    icon: "🪑",
    check: (s) => s.totalPlays >= 50,
  },
  {
    id: "veteran",
    name: "ベテランプレイヤー",
    description: "100回プレイを記録した",
    icon: "🏅",
    check: (s) => s.totalPlays >= 100,
  },
  {
    id: "master",
    name: "ボドゲマスター",
    description: "500回プレイを記録した",
    icon: "👑",
    check: (s) => s.totalPlays >= 500,
  },

  // ゲーム種類系
  {
    id: "adventurer",
    name: "冒険者",
    description: "5種類のゲームをプレイした",
    icon: "🗺️",
    check: (s) => s.uniqueGames >= 5,
  },
  {
    id: "collector",
    name: "コレクター",
    description: "20種類のゲームをプレイした",
    icon: "📚",
    check: (s) => s.uniqueGames >= 20,
  },
  {
    id: "professor",
    name: "ゲーム博士",
    description: "50種類のゲームをプレイした",
    icon: "🎓",
    check: (s) => s.uniqueGames >= 50,
  },

  // 同一ゲーム系
  {
    id: "devoted",
    name: "こだわりの一本",
    description: "同じゲームを10回プレイした",
    icon: "💎",
    check: (s) => s.maxSameGame >= 10,
  },
  {
    id: "mastered",
    name: "極めし者",
    description: "同じゲームを30回プレイした",
    icon: "⚔️",
    check: (s) => s.maxSameGame >= 30,
  },

  // 評価系
  {
    id: "connoisseur",
    name: "目利き",
    description: "平均評価4.5以上（10回以上プレイ）",
    icon: "🧐",
    check: (s) => s.totalPlays >= 10 && s.averageRating >= 4.5,
  },
  {
    id: "fan",
    name: "推しが多い",
    description: "星5の評価を10回つけた",
    icon: "⭐",
    check: (s) => s.fiveStarCount >= 10,
  },

  // 連続プレイ系
  {
    id: "weekly",
    name: "週間チャレンジ",
    description: "7日連続でプレイを記録した",
    icon: "🔥",
    check: (s) => s.maxConsecutiveDays >= 7,
  },
  {
    id: "monthly",
    name: "月間マラソン",
    description: "30日連続でプレイを記録した",
    icon: "🏆",
    check: (s) => s.maxConsecutiveDays >= 30,
  },
]

function calculateMaxConsecutiveDays(plays: PlayData[]): number {
  if (plays.length === 0) return 0

  // Get unique dates sorted
  const dates = [...new Set(plays.map((p) => {
    const d = new Date(p.playedAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }))].sort()

  if (dates.length === 0) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffMs = curr.getTime() - prev.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
}

export function calculateTitles(plays: PlayData[]): TitleWithUnlocked[] {
  const totalPlays = plays.length
  const uniqueGames = new Set(plays.map((p) => p.gameId)).size
  const averageRating = totalPlays > 0
    ? plays.reduce((sum, p) => sum + p.rating, 0) / totalPlays
    : 0

  // Max plays of same game
  const gameCountMap = new Map<string, number>()
  plays.forEach((p) => {
    gameCountMap.set(p.gameId, (gameCountMap.get(p.gameId) ?? 0) + 1)
  })
  const maxSameGame = Math.max(0, ...gameCountMap.values())

  const fiveStarCount = plays.filter((p) => p.rating === 5).length
  const maxConsecutiveDays = calculateMaxConsecutiveDays(plays)

  const stats: TitleStats = {
    totalPlays,
    uniqueGames,
    averageRating,
    maxSameGame,
    fiveStarCount,
    maxConsecutiveDays,
  }

  return TITLES.map((title) => ({
    id: title.id,
    name: title.name,
    description: title.description,
    icon: title.icon,
    unlocked: title.check(stats),
  }))
}
