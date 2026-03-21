import { describe, it, expect } from "vitest"
import { calculateBoardgameType } from "@/lib/boardgame-type"

const makeEntry = (gameId: string, sessionCount = 1) => ({ gameId, sessionCount })
const makeGame = (gameId: string, options: { weight?: number | null; categories?: string; mechanics?: string } = {}) => ({
  gameId,
  weight: options.weight ?? null,
  categories: options.categories ?? null,
  mechanics: options.mechanics ?? null,
})

describe("calculateBoardgameType", () => {
  it("returns party-explorer for empty data (defaults to light + wide)", () => {
    const result = calculateBoardgameType({ entries: [], games: [] })
    // No data: weightScore=50 (default), varietyScore capped at 95 (no entries) → heavy+wide
    // Actually with 0 entries avgSessionsPerGame=1 → varietyScore = 105-1*20 = 85 → wide
    // weightScore=50 → isHeavy=true → strategic-explorer
    expect(result).toHaveProperty("id")
    expect(result).toHaveProperty("weightScore")
    expect(result).toHaveProperty("varietyScore")
    expect(result).toHaveProperty("socialScore")
    expect(result).toHaveProperty("themeScore")
  })

  it("returns strategic-specialist for heavy game played many times", () => {
    const entries = [makeEntry("g1", 20)]
    const games = [makeGame("g1", { weight: 4.5, categories: "Economic", mechanics: "Worker Placement" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("strategic-specialist")
    expect(result.weightScore).toBeGreaterThan(50)
    expect(result.varietyScore).toBeLessThan(50)
  })

  it("returns party-explorer for many different light games", () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = entries.map((e) =>
      makeGame(e.gameId, { weight: 1.2, categories: "Party Game", mechanics: "Dice Rolling" })
    )
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-explorer")
    expect(result.weightScore).toBeLessThan(50)
    expect(result.varietyScore).toBeGreaterThan(50)
  })

  it("returns party-specialist for one light game played many times", () => {
    const entries = [makeEntry("g1", 15)]
    const games = [makeGame("g1", { weight: 1.5, categories: "Party Game", mechanics: "Bluffing" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-specialist")
  })

  it("returns strategic-explorer for many different heavy games", () => {
    const entries = Array.from({ length: 8 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = entries.map((e) =>
      makeGame(e.gameId, { weight: 4.0, categories: "Economic", mechanics: "Engine Building" })
    )
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("strategic-explorer")
  })

  it("weightScore uses BGG weight when enough games have it", () => {
    const entries = [makeEntry("g1"), makeEntry("g2"), makeEntry("g3")]
    const games = [
      makeGame("g1", { weight: 5.0 }),
      makeGame("g2", { weight: 5.0 }),
      makeGame("g3", { weight: 5.0 }),
    ]
    const result = calculateBoardgameType({ entries, games })
    // avgWeight=5.0 → weightScore = ((5-1)/4)*100 = 100
    expect(result.weightScore).toBe(100)
  })

  it("varietyScore is high when avg sessions per game is low", () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = entries.map((e) => makeGame(e.gameId))
    const result = calculateBoardgameType({ entries, games })
    // avgSessionsPerGame=1 → varietyScore = min(95, 105-20) = 85
    expect(result.varietyScore).toBe(85)
  })

  it("socialScore is high for cooperative games", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { categories: "Cooperative Game", mechanics: "Team-Based Game" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.socialScore).toBeGreaterThan(50)
  })

  it("themeScore is high for thematic games", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { categories: "Fantasy, Adventure", mechanics: "Storytelling" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.themeScore).toBeGreaterThan(50)
  })

  it("scores are always in range 0-100", () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, i + 1))
    const games = entries.map((e) =>
      makeGame(e.gameId, { weight: 3.0, categories: "Fantasy", mechanics: "Deck Building" })
    )
    const result = calculateBoardgameType({ entries, games })
    expect(result.weightScore).toBeGreaterThanOrEqual(0)
    expect(result.weightScore).toBeLessThanOrEqual(100)
    expect(result.varietyScore).toBeGreaterThanOrEqual(0)
    expect(result.varietyScore).toBeLessThanOrEqual(100)
    expect(result.socialScore).toBeGreaterThanOrEqual(0)
    expect(result.socialScore).toBeLessThanOrEqual(100)
    expect(result.themeScore).toBeGreaterThanOrEqual(0)
    expect(result.themeScore).toBeLessThanOrEqual(100)
  })
})
