import { describe, it, expect } from "vitest"
import { calculateBoardgameType } from "@/lib/boardgame-type"

const makeEntry = (gameId: string, sessionCount = 1, rating?: number) => ({ gameId, sessionCount, rating })
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
  // ============================================================
  // 基本動作
  // ============================================================

  it("returns balanced for empty data", () => {
    const result = calculateBoardgameType({ entries: [], games: [] })
    expect(result.id).toBe("balanced")
    expect(result.scores.depth).toBe(33)
  })

  it("has valid structural fields", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "Worker Placement" })],
    })
    expect(result).toHaveProperty("id")
    expect(result).toHaveProperty("name")
    expect(result).toHaveProperty("icon")
    expect(result).toHaveProperty("tagline")
    expect(result).toHaveProperty("description")
    expect(result.scores).toHaveProperty("depth")
    expect(result.scores).toHaveProperty("competition")
    expect(result.scores).toHaveProperty("chaos")
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

  it("unknown mechanics are ignored gracefully", () => {
    const entries = [makeEntry("g1")]
    const games = [makeGame("g1", { mechanics: "NonExistentMechanic123, AnotherFake456" })]
    expect(() => calculateBoardgameType({ entries, games })).not.toThrow()
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBeDefined()
  })

  // ============================================================
  // Depth 軸（深さ・重さ）
  // ============================================================

  it("heavy game (weight=5) has high depth score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 5, mechanics: "Worker Placement, Engine Building" })],
    })
    expect(result.scores.depth).toBeGreaterThanOrEqual(80)
  })

  it("light game (weight=1) has low depth score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 1, mechanics: "Dice Rolling" })],
    })
    expect(result.scores.depth).toBeLessThanOrEqual(30)
  })

  it("weight is primary signal for depth — heavier game has higher depth than lighter game with same mechanics", () => {
    const heavy = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 5, mechanics: "Worker Placement" })],
    })
    const light = calculateBoardgameType({
      entries: [makeEntry("g2")],
      games: [makeGame("g2", { weight: 1, mechanics: "Worker Placement" })],
    })
    expect(heavy.scores.depth).toBeGreaterThan(light.scores.depth)
  })

  // ============================================================
  // Competition 軸（対戦性）
  // ============================================================

  it("competitive game (Area Control + Negotiation) has high competition score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "Area Control, Negotiation, Take That" })],
    })
    expect(result.scores.competition).toBeGreaterThanOrEqual(80)
  })

  it("cooperative game (Cooperative Game + Team-Based) has low competition score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "Cooperative Game, Team-Based Game" })],
    })
    expect(result.scores.competition).toBeLessThanOrEqual(30)
  })

  it("neutral game (no interaction mechanics) has competition near 50", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "Deck Building, Resource Management" })],
    })
    expect(result.scores.competition).toBeGreaterThanOrEqual(35)
    expect(result.scores.competition).toBeLessThanOrEqual(65)
  })

  // ============================================================
  // Chaos 軸（カオス度）
  // ============================================================

  it("luck-heavy game has high chaos score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move" })],
    })
    expect(result.scores.chaos).toBeGreaterThanOrEqual(80)
  })

  it("pure strategy game has low chaos score", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 4, mechanics: "Worker Placement, Abstract Strategy, Tile Placement" })],
    })
    expect(result.scores.chaos).toBeLessThanOrEqual(25)
  })

  // ============================================================
  // タイプ分類
  // ============================================================

  it("returns cooperative when cooperative mechanics dominate", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 3, mechanics: "Cooperative Game, Team-Based Game, Hand Management" })],
    })
    expect(result.id).toBe("cooperative")
    expect(result.scores.competition).toBeLessThanOrEqual(28)
  })

  it("returns gambler for luck-heavy games", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 1, mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move" })],
    })
    expect(result.id).toBe("gambler")
    expect(result.scores.chaos).toBeGreaterThanOrEqual(72)
  })

  it("returns heavy-strategist for heavy competitive strategy", () => {
    // Weight 5 + strategy + competition
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", {
        weight: 5,
        mechanics: "Worker Placement, Abstract Strategy, Area Control, Take That",
      })],
    })
    expect(result.id).toBe("heavy-strategist")
    expect(result.scores.depth).toBeGreaterThanOrEqual(60)
  })

  it("returns engine-builder for heavy low-competition strategy", () => {
    // Heavy deck/engine building without competition
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", {
        weight: 4,
        mechanics: "Deck Building, Engine Building, Resource Management",
      })],
    })
    expect(result.id).toBe("engine-builder")
    expect(result.scores.depth).toBeGreaterThanOrEqual(60)
    expect(result.scores.competition).toBeLessThan(55)
  })

  it("returns negotiator for high-competition low-chaos medium games", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", {
        weight: 3,
        mechanics: "Negotiation, Area Control, Trading, Worker Placement",
      })],
    })
    expect(result.id).toBe("negotiator")
    expect(result.scores.competition).toBeGreaterThanOrEqual(68)
    expect(result.scores.chaos).toBeLessThanOrEqual(45)
  })

  it("returns trickster for social deduction / bluffing games", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", {
        mechanics: "Social Deduction, Hidden Roles, Bluffing, Area Control",
      })],
    })
    expect(result.id).toBe("trickster")
    expect(result.scores.competition).toBeGreaterThanOrEqual(62)
  })

  it("returns party-master for light party/social games", () => {
    // Mix of light party games: word, physical, social
    const entries = [
      makeEntry("g1"), makeEntry("g2"), makeEntry("g3"),
      makeEntry("g4"), makeEntry("g5"), makeEntry("g6"),
    ]
    const games = [
      makeGame("g1", { weight: 1, mechanics: "Memory, Pattern Recognition" }),        // speed/reaction
      makeGame("g2", { weight: 1, mechanics: "Real-Time, Speed Matching, Pattern Recognition" }), // speed
      makeGame("g3", { weight: 1, mechanics: "Social Deduction" }),                   // social
      makeGame("g4", { weight: 1, mechanics: "Bluffing" }),                           // bluffing
      makeGame("g5", { weight: 1, mechanics: "Word Game" }),                          // word
      makeGame("g6", { weight: 1, mechanics: "Physical" }),                           // physical
    ]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("party-master")
    expect(result.scores.depth).toBeLessThanOrEqual(40)
  })

  it("returns casual for light low-chaos games", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { weight: 1.5, mechanics: "Set Collection, Hand Management" })],
    })
    expect(result.id).toBe("casual")
    expect(result.scores.depth).toBeLessThanOrEqual(45)
    expect(result.scores.chaos).toBeLessThanOrEqual(55)
  })

  it("returns balanced for diverse play across all axes", () => {
    // heavy strategy + light luck + interaction + cooperative + mid-weight luck
    // → depth≈45, competition≈50, chaos≈60 — avoids all type conditions
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`g${i}`, 1))
    const games = [
      makeGame("g0", { weight: 4, mechanics: "Worker Placement" }),
      makeGame("g1", { weight: 1, mechanics: "Dice Rolling" }),
      makeGame("g2", { mechanics: "Area Control" }),
      makeGame("g3", { mechanics: "Cooperative Game" }),
      makeGame("g4", { weight: 2, mechanics: "Push Your Luck" }),
    ]
    const result = calculateBoardgameType({ entries, games })
    expect(result.id).toBe("balanced")
  })

  // ============================================================
  // 重み付けと評価
  // ============================================================

  it("session count weighting: frequently played game has more influence", () => {
    // strategy game played 10x vs luck game played 1x
    const entries = [makeEntry("strategy", 10), makeEntry("luck", 1)]
    const games = [
      makeGame("strategy", { weight: 4, mechanics: "Worker Placement, Engine Building" }),
      makeGame("luck", { weight: 1, mechanics: "Dice Rolling, Push Your Luck" }),
    ]
    const result = calculateBoardgameType({ entries, games })
    // Strategy-dominant → low chaos, high depth
    expect(result.scores.chaos).toBeLessThan(result.scores.depth)
  })

  it("high rating increases game influence on player profile", () => {
    const highRated = calculateBoardgameType({
      entries: [makeEntry("strategy", 2, 5), makeEntry("luck", 2, 1)],
      games: [
        makeGame("strategy", { weight: 4, mechanics: "Worker Placement, Engine Building" }),
        makeGame("luck", { weight: 1, mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move" }),
      ],
    })
    const equalRated = calculateBoardgameType({
      entries: [makeEntry("strategy", 2, 3), makeEntry("luck", 2, 3)],
      games: [
        makeGame("strategy", { weight: 4, mechanics: "Worker Placement, Engine Building" }),
        makeGame("luck", { weight: 1, mechanics: "Dice Rolling, Push Your Luck, Roll / Spin and Move" }),
      ],
    })
    // High-rating-strategy player should have lower chaos (more strategy-leaning)
    expect(highRated.scores.chaos).toBeLessThan(equalRated.scores.chaos)
  })

  it("returns balanced when all games are unmapped", () => {
    const result = calculateBoardgameType({
      entries: [makeEntry("g1")],
      games: [makeGame("g1", { mechanics: "NonExistent1, NonExistent2" })],
    })
    expect(result.id).toBe("balanced")
  })
})
