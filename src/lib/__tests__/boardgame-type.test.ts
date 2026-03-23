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

  it("returns pure-strategist for strategy-only heavy games (no luck, no interaction)", () => {
    // Worker Placement + Abstract Strategy + Tile Placement with weight 5
    // → strategy=100, luck=0, interaction=0 → pure-strategist
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { weight: 5, mechanics: "Worker Placement, Abstract Strategy, Tile Placement" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("pure-strategist")
    expect(result.scores.strategy).toBeGreaterThanOrEqual(65)
    expect(result.scores.luck).toBeLessThanOrEqual(35)
    expect(result.scores.interaction).toBeLessThanOrEqual(40)
  })

  it("returns strategic-player when strategy is primary and interaction is significant", () => {
    // Worker Placement + Abstract Strategy + Tile Placement (strategy) + Area Control + Take That (interaction)
    // strategy=100, interaction≈72 → strategy primary, interaction>=45 → strategic-player
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 3,
      mechanics: "Worker Placement, Abstract Strategy, Tile Placement, Area Control, Take That",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("strategic-player")
    expect(result.scores.strategy).toBeGreaterThan(result.scores.interaction)
    expect(result.scores.interaction).toBeGreaterThanOrEqual(45)
  })

  it("returns engine-builder when strategy is primary but neither pure nor interactive", () => {
    // Engine Building + Deck Building + Resource Management + some luck mechanics
    // → strategy primary, luck too high for pure-strategist, interaction low → engine-builder
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      mechanics: "Engine Building, Deck Building, Resource Management, Random Production, Chit-Pull System",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("engine-builder")
    expect(result.scores.strategy).toBeGreaterThan(result.scores.luck)
  })

  it("returns negotiator when interaction is primary and party is low", () => {
    // Area Control + Negotiation + Take That (interaction) + Worker Placement + Tile Placement (strategy)
    // interaction=100, strategy≈55, party≈7 → interaction primary, party<45 → negotiator
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 3,
      mechanics: "Area Control, Negotiation, Take That, Worker Placement, Tile Placement",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("negotiator")
    expect(result.scores.interaction).toBeGreaterThan(result.scores.party)
  })

  it("returns trickster when interaction is primary and party is significant", () => {
    // Area Control + Bluffing + Hidden Roles + Social Deduction
    // interaction=100, party≈54 → interaction primary, party>=45 → trickster
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Area Control, Bluffing, Hidden Roles, Social Deduction" })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("trickster")
    expect(result.scores.interaction).toBeGreaterThanOrEqual(65)
    expect(result.scores.party).toBeGreaterThanOrEqual(45)
  })

  it("returns party-maker when party is primary and interaction is moderate", () => {
    // Acting + Role Playing + Storytelling + Cooperative + Team-Based
    // party=100, interaction≈53 → party primary, luck<40, interaction>=35 → party-maker
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Acting, Role Playing, Storytelling, Cooperative Game, Team-Based Game",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-maker")
    expect(result.scores.party).toBeGreaterThan(result.scores.luck)
    expect(result.scores.interaction).toBeGreaterThanOrEqual(35)
  })

  it("returns gambler when luck is primary and party is low", () => {
    // Dice Rolling + Push Your Luck + Roll/Spin → luck=100, party=0 → gambler
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("gambler")
    expect(result.scores.luck).toBeGreaterThan(result.scores.party)
  })

  it("returns speed-player when speed is primary", () => {
    // Real-Time + Speed Matching + Pattern Recognition → speed=100 → speed-player
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Real-Time, Speed Matching, Pattern Recognition",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("speed-player")
    expect(result.scores.speed).toBeGreaterThan(result.scores.strategy)
  })

  it("returns casual when party is primary and luck is significant", () => {
    // Dice Rolling + Push Your Luck + Acting + Role Playing + Storytelling
    // party=100, luck≈54 → party primary, luck>=40 → casual
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      mechanics: "Dice Rolling, Push Your Luck, Acting, Role Playing, Storytelling",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("casual")
    expect(result.scores.luck).toBeGreaterThanOrEqual(40)
    expect(result.scores.party).toBeGreaterThan(result.scores.strategy)
  })

  it("returns casual when luck is primary and party is significant", () => {
    // Gambler-adjacent but with strong party element
    // Dice Rolling + Push Your Luck + Trivia + Acting → luck primary, party≈high → casual
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", {
      weight: 1,
      mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move, Trivia, Acting",
    })]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("casual")
    expect(result.scores.luck).toBeGreaterThanOrEqual(40)
  })

  it("returns balanced when top 3 axes are all significant (secondScore>=65 && thirdScore>=45)", () => {
    // 5 different games each from a different axis — all axes roughly equal
    // After normalization: strategy≈100, interaction≈93, party≈71, luck≈64, speed≈29
    // secondScore(93)>=65 && thirdScore(71)>=45 → balanced
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

  it("sparse data (few mechanics) normalizes correctly — no longer falls through to balanced", () => {
    // Previously: maxRaw<=14 used scale=7, forcing low scores → balanced fallback
    // Now: always 100/maxRaw → single mechanic → that axis = 100 → correct type
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "Deck Building" })]
    const result = calculateBoardgameType({ entries, games })
    // Deck Building → ENGINE → strategy dominant, no luck/interaction → pure-strategist or engine-builder
    expect(result.id).not.toBe("balanced")
    expect(result.scores.strategy).toBe(100)
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
    const games = [makeGame("g1", { mechanics: "Worker Placement" })]
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

  it("weight correction: heavier games suppress speed relative to strategy", () => {
    // With both strategy and speed mechanics, weight shifts the balance:
    // heavy → strategy raw up, speed raw down → speed score lower after normalization
    const sameGame = { mechanics: "Worker Placement, Real-Time" }
    const heavy = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 5, ...sameGame })],
    })
    const light = calculateBoardgameType({
      entries: [makeEntry("g2")],
      games: [makeGame("g2", { weight: 1, ...sameGame })],
    })
    // Both normalize strategy to 100 (primary axis), but heavy suppresses speed
    expect(heavy.scores.speed).toBeLessThan(light.scores.speed)
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

  it("cooperative game contributes to both interaction and party", () => {
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
