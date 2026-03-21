export interface Title {
  id: string
  name: string
  description: string
  icon: string
}

export interface TitleWithUnlocked extends Title {
  unlocked: boolean
}

export interface TitleData {
  entries: { gameId: string; rating: number }[]
  sessions: { playedAt: Date; gameId: string }[]
  games?: { categories: string | null; mechanics: string | null }[] // プレイ済みゲームのメタデータ
  wishlistCount?: number
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
  uniqueCategories: number
  uniqueMechanics: number
  maxSameCategory: number
  maxSameMechanic: number
  wishlistCount: number
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
    description: "平均評価4.5以上（10種類以上プレイ）",
    icon: "🧐",
    check: (s) => s.uniqueGames >= 10 && s.averageRating >= 4.5,
  },
  {
    id: "fan",
    name: "推しが多い",
    description: "星5の評価を10ゲームにつけた",
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

  // カテゴリ系
  {
    id: "genre-explorer",
    name: "ジャンル探検家",
    description: "5種類以上のカテゴリのゲームをプレイした",
    icon: "🗺️",
    check: (s) => s.uniqueCategories >= 5,
  },
  {
    id: "genre-allrounder",
    name: "オールラウンダー",
    description: "10種類以上のカテゴリのゲームをプレイした",
    icon: "🌈",
    check: (s) => s.uniqueCategories >= 10,
  },
  {
    id: "genre-specialist",
    name: "ジャンルの達人",
    description: "同じカテゴリのゲームを10本以上プレイした",
    icon: "🎯",
    check: (s) => s.maxSameCategory >= 10,
  },

  // メカニクス系
  {
    id: "mechanic-hunter",
    name: "メカニクスハンター",
    description: "5種類以上のメカニクスを経験した",
    icon: "⚙️",
    check: (s) => s.uniqueMechanics >= 5,
  },
  {
    id: "mechanic-expert",
    name: "ゲームシステム通",
    description: "15種類以上のメカニクスを経験した",
    icon: "🔧",
    check: (s) => s.uniqueMechanics >= 15,
  },
  {
    id: "mechanic-devotee",
    name: "こだわりのスタイル",
    description: "同じメカニクスのゲームを10本以上プレイした",
    icon: "💡",
    check: (s) => s.maxSameMechanic >= 10,
  },

  // 気になる系
  {
    id: "wishlist-dreamer",
    name: "夢想家",
    description: "気になるリストに3件追加した",
    icon: "🌙",
    check: (s) => s.wishlistCount >= 3,
  },
  {
    id: "wishlist-collector",
    name: "欲しいものリスト",
    description: "気になるリストに10件追加した",
    icon: "📋",
    check: (s) => s.wishlistCount >= 10,
  },
]

function calculateMaxConsecutiveDays(sessions: { playedAt: Date }[]): number {
  if (sessions.length === 0) return 0

  const dates = [...new Set(sessions.map((s) => {
    const d = new Date(s.playedAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }))].sort((a, b) => a.localeCompare(b))

  if (dates.length === 0) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
}

export function calculateTitles({ entries, sessions, games = [], wishlistCount = 0 }: TitleData): TitleWithUnlocked[] {
  const totalPlays = sessions.length
  const uniqueGames = entries.length
  const averageRating =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length
      : 0

  const sessionCountByGame = new Map<string, number>()
  sessions.forEach((s) => {
    sessionCountByGame.set(s.gameId, (sessionCountByGame.get(s.gameId) ?? 0) + 1)
  })
  const maxSameGame = Math.max(0, ...sessionCountByGame.values())

  const fiveStarCount = entries.filter((e) => e.rating === 5).length
  const maxConsecutiveDays = calculateMaxConsecutiveDays(sessions)

  // カテゴリ・メカニクス統計
  const categoryCount = new Map<string, number>()
  const mechanicCount = new Map<string, number>()
  games.forEach((g) => {
    g.categories?.split(",").forEach((c) => {
      const key = c.trim()
      if (key) categoryCount.set(key, (categoryCount.get(key) ?? 0) + 1)
    })
    g.mechanics?.split(",").forEach((m) => {
      const key = m.trim()
      if (key) mechanicCount.set(key, (mechanicCount.get(key) ?? 0) + 1)
    })
  })
  const uniqueCategories = categoryCount.size
  const uniqueMechanics = mechanicCount.size
  const maxSameCategory = Math.max(0, ...categoryCount.values())
  const maxSameMechanic = Math.max(0, ...mechanicCount.values())

  const stats: TitleStats = {
    totalPlays,
    uniqueGames,
    averageRating,
    maxSameGame,
    fiveStarCount,
    maxConsecutiveDays,
    uniqueCategories,
    uniqueMechanics,
    maxSameCategory,
    maxSameMechanic,
    wishlistCount,
  }

  return TITLES.map((title) => ({
    id: title.id,
    name: title.name,
    description: title.description,
    icon: title.icon,
    unlocked: title.check(stats),
  }))
}
