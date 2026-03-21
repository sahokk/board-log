import { describe, it, expect } from "vitest"
import { calculateBoardgameType } from "@/lib/boardgame-type"

const makeEntry = (gameId: string, sessionCount = 1) => ({ gameId, sessionCount })
const makeGame = (
  gameId: string,
  options: { weight?: number | null; categories?: string; mechanics?: string } = {}
) => ({
  gameId,
  weight: options.weight ?? null,
  categories: options.categories ?? null,
  mechanics: options.mechanics ?? null,
})

describe("calculateBoardgameType", () => {
  it("returns balanced for empty data", () => {
    const result = calculateBoardgameType({ entries: [], games: [] })
    expect(result.id).toBe("balanced")
    expect(result.scores.strategy).toBe(20)
    expect(result.scores.luck).toBe(20)
  })

  it("returns strategist for strategy-heavy mechanics", () => {
    const entries = [makeEntry("g1", 5)]
    const games = [makeGame("g1", { weight: 4, mechanics: "Worker Placement, Engine Building, Tile Placement" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("strategist")
    expect(result.scores.strategy).toBeGreaterThan(result.scores.luck)
    expect(result.scores.strategy).toBeGreaterThan(result.scores.party)
  })

  it("returns casual for luck/speed-heavy mechanics", () => {
    const entries = [makeEntry("g1", 5)]
    const games = [makeGame("g1", { weight: 1.2, mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("casual")
    expect(result.scores.luck).toBeGreaterThan(result.scores.strategy)
  })

  it("returns interactor for interaction-heavy mechanics", () => {
    const entries = [makeEntry("g1", 5)]
    const games = [makeGame("g1", { mechanics: "Area Control, Take That, Negotiation" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("interactor")
    expect(result.scores.interaction).toBeGreaterThan(result.scores.luck)
  })

  it("returns party-maker for party/social mechanics", () => {
    const entries = [makeEntry("g1", 5)]
    const games = [makeGame("g1", { categories: "Party Game", mechanics: "Acting, Storytelling, Role Playing" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-maker")
    expect(result.scores.party).toBeGreaterThan(result.scores.strategy)
  })

  it("returns balanced when all scores are close", () => {
    // Mixed game with many different mechanics → scores cluster
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = [
      makeGame("g0", { mechanics: "Worker Placement" }),
      makeGame("g1", { mechanics: "Dice Rolling" }),
      makeGame("g2", { mechanics: "Area Control" }),
      makeGame("g3", { mechanics: "Storytelling" }),
      makeGame("g4", { mechanics: "Real-Time" }),
    ]
    const result = calculateBoardgameType({ entries, games })
    // All scores should be present (no single dominant axis → balanced)
    const s = result.scores
    const max = Math.max(s.strategy, s.luck, s.interaction, s.party, s.speed)
    const min = Math.min(s.strategy, s.luck, s.interaction, s.party, s.speed)
    expect(result.id).toBe("balanced")
    expect(max - min).toBeLessThan(20)
  })

  it("weight correction increases strategy for heavy games", () => {
    const heavyEntries = [makeEntry("g1")]
    const lightEntries = [makeEntry("g2")]
    const sameGame = { mechanics: "Worker Placement" }
    const heavy = calculateBoardgameType({
      entries: heavyEntries,
      games: [makeGame("g1", { weight: 5, ...sameGame })],
    })
    const light = calculateBoardgameType({
      entries: lightEntries,
      games: [makeGame("g2", { weight: 1, ...sameGame })],
    })
    expect(heavy.scores.strategy).toBeGreaterThan(light.scores.strategy)
    expect(heavy.scores.speed).toBeLessThanOrEqual(light.scores.speed)
  })

  it("session count weighting: frequently played game has more influence", () => {
    const entries = [makeEntry("strategy", 10), makeEntry("luck", 1)]
    const games = [
      makeGame("strategy", { mechanics: "Worker Placement, Engine Building" }),
      makeGame("luck", { mechanics: "Dice Rolling, Push Your Luck" }),
    ]
    const result = calculateBoardgameType({ entries, games })
    expect(result.scores.strategy).toBeGreaterThan(result.scores.luck)
  })

  it("all scores are in range 0-100", () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, i + 1))
    const games = entries.map((e) =>
      makeGame(e.gameId, { weight: 3.5, mechanics: "Worker Placement, Dice Rolling, Area Control" })
    )
    const result = calculateBoardgameType({ entries, games })
    for (const score of Object.values(result.scores)) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it("has valid id, name, icon, subType fields", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Deck Building" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result).toHaveProperty("id")
    expect(result).toHaveProperty("name")
    expect(result).toHaveProperty("icon")
    expect(result).toHaveProperty("tagline")
    expect(result).toHaveProperty("description")
    expect(result).toHaveProperty("subType")
    expect(result).toHaveProperty("subTypeId")
    expect(result).toHaveProperty("scores")
    expect(result.scores).toHaveProperty("strategy")
    expect(result.scores).toHaveProperty("luck")
    expect(result.scores).toHaveProperty("interaction")
    expect(result.scores).toHaveProperty("party")
    expect(result.scores).toHaveProperty("speed")
  })

  it("cooperative game contributes to interaction and party", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Cooperative Game, Team-Based Game" })]
    const result = calculateBoardgameType({ entries, games })
    // Cooperative → SOCIAL → interaction + party
    expect(result.scores.interaction).toBeGreaterThan(0)
    expect(result.scores.party).toBeGreaterThan(0)
  })

  it("unknown mechanics are ignored gracefully", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "NonExistentMechanic123, AnotherFake456" })]
    expect(() => calculateBoardgameType({ entries, games })).not.toThrow()
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBeDefined()
  })
})
