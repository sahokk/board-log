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

  it("returns pure-strategist for strategy-only heavy games", () => {
    // Worker Placement + Abstract Strategy + Tile Placement with weight 5 → strategy≈100, luck=0
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { weight: 5, mechanics: "Worker Placement, Abstract Strategy, Tile Placement" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("pure-strategist")
    expect(result.scores.strategy).toBeGreaterThanOrEqual(75)
    expect(result.scores.luck).toBeLessThanOrEqual(30)
  })

  it("returns strategic-player for strategy + interaction games with some luck", () => {
    // strategy≈79, interaction≈100, luck≈38 → breaks pure-strategist (luck>30), hits strategic-player
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 3,
      mechanics: "Worker Placement, Abstract Strategy, Area Control, Take That, Player Elimination, Dice Rolling",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("strategic-player")
    expect(result.scores.strategy).toBeGreaterThanOrEqual(70)
    expect(result.scores.interaction).toBeGreaterThanOrEqual(50)
  })

  it("returns engine-builder for deck/engine building with light luck", () => {
    // Engine Building + Deck Building + Resource Management + some luck → breaks pure-strategist
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      mechanics: "Engine Building, Deck Building, Resource Management, Random Production, Chit-Pull System",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("engine-builder")
    expect(result.scores.strategy).toBeGreaterThanOrEqual(65)
  })

  it("returns negotiator for interaction + strategy mix without much party", () => {
    // Negotiation + Area Control + Take That + Worker Placement + Tile Placement
    // strategy≈55, interaction≈100, party≈7
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 3,
      mechanics: "Area Control, Negotiation, Take That, Worker Placement, Tile Placement",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("negotiator")
    expect(result.scores.interaction).toBeGreaterThanOrEqual(70)
    expect(result.scores.strategy).toBeGreaterThanOrEqual(40)
  })

  it("returns trickster for bluffing/social deduction mechanics", () => {
    // Area Control + Bluffing + Hidden Roles + Social Deduction
    // interaction≈100, party≈55, strategy≈3 → trickster
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Area Control, Bluffing, Hidden Roles, Social Deduction" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("trickster")
    expect(result.scores.interaction).toBeGreaterThanOrEqual(65)
    expect(result.scores.party).toBeGreaterThanOrEqual(50)
  })

  it("returns party-maker for party/social mechanics with weight 1", () => {
    // Acting + Role Playing + Storytelling + Cooperative Game + Team-Based Game
    // party≈100, interaction≈53 → party-maker
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Acting, Role Playing, Storytelling, Cooperative Game, Team-Based Game",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-maker")
    expect(result.scores.party).toBeGreaterThanOrEqual(70)
    expect(result.scores.interaction).toBeGreaterThanOrEqual(50)
  })

  it("returns gambler for luck-heavy mechanics with light games", () => {
    // Dice Rolling + Push Your Luck + Roll/Spin → luck≈100, strategy≈0
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("gambler")
    expect(result.scores.luck).toBeGreaterThanOrEqual(70)
    expect(result.scores.strategy).toBeLessThanOrEqual(50)
  })

  it("returns speed-player for real-time mechanics", () => {
    // Real-Time + Speed Matching + Pattern Recognition → speed≈100, strategy≈0
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Real-Time, Speed Matching, Pattern Recognition",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("speed-player")
    expect(result.scores.speed).toBeGreaterThanOrEqual(70)
  })

  it("returns casual for luck + party mix below gambler threshold", () => {
    // Dice Rolling + Push Your Luck + Acting + Role Playing + Storytelling
    // luck≈55, party≈100, interaction<50, gambler doesn't fire (luck<70)
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      mechanics: "Dice Rolling, Push Your Luck, Acting, Role Playing, Storytelling",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("casual")
    expect(result.scores.luck).toBeGreaterThanOrEqual(50)
    expect(result.scores.party).toBeGreaterThanOrEqual(50)
    expect(result.scores.strategy).toBeLessThanOrEqual(50)
  })

  it("returns balanced when all scores are close", () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = [
      makeGame("g0", { mechanics: "Worker Placement" }),
      makeGame("g1", { mechanics: "Dice Rolling" }),
      makeGame("g2", { mechanics: "Area Control" }),
      makeGame("g3", { mechanics: "Storytelling" }),
      makeGame("g4", { mechanics: "Real-Time" }),
    ]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("balanced")
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

  it("has valid structural fields without subType", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Deck Building" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result).toHaveProperty("id")
    expect(result).toHaveProperty("name")
    expect(result).toHaveProperty("icon")
    expect(result).toHaveProperty("tagline")
    expect(result).toHaveProperty("description")
    expect(result).not.toHaveProperty("subType")
    expect(result).not.toHaveProperty("subTypeId")
    expect(result.scores).toHaveProperty("strategy")
    expect(result.scores).toHaveProperty("luck")
    expect(result.scores).toHaveProperty("interaction")
    expect(result.scores).toHaveProperty("party")
    expect(result.scores).toHaveProperty("speed")
  })

  it("weight correction increases strategy for heavy games", () => {
    const sameGame = { mechanics: "Worker Placement" }
    const heavy = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 5, ...sameGame })],
    })
    const light = calculateBoardgameType({
      entries: [makeEntry("g2")],
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

  it("cooperative game contributes to interaction and party", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Cooperative Game, Team-Based Game" })]
    const result = calculateBoardgameType({ entries, games })
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
