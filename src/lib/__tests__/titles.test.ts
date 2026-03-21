import { describe, it, expect } from "vitest"
import { calculateTitles } from "@/lib/titles"

const noSessions: { playedAt: Date; gameId: string }[] = []
const noEntries: { gameId: string; rating: number }[] = []

describe("calculateTitles", () => {
  it("returns all titles as locked when there are no sessions", () => {
    const titles = calculateTitles({ entries: noEntries, sessions: noSessions })
    expect(titles.every((t) => !t.unlocked)).toBe(true)
  })

  it("unlocks first-step after 1 session", () => {
    const sessions = [{ playedAt: new Date("2025-01-01"), gameId: "g1" }]
    const entries = [{ gameId: "g1", rating: 3 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "first-step")?.unlocked).toBe(true)
  })

  it("does not unlock apprentice with fewer than 10 sessions", () => {
    const sessions = Array.from({ length: 9 }, (_, i) => ({
      playedAt: new Date(`2025-01-${String(i + 1).padStart(2, "0")}`),
      gameId: "g1",
    }))
    const entries = [{ gameId: "g1", rating: 4 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "apprentice")?.unlocked).toBe(false)
  })

  it("unlocks apprentice at exactly 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      playedAt: new Date(`2025-01-${String(i + 1).padStart(2, "0")}`),
      gameId: "g1",
    }))
    const entries = [{ gameId: "g1", rating: 4 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "apprentice")?.unlocked).toBe(true)
  })

  it("unlocks collector at 20 unique games", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({ gameId: `g${i}`, rating: 3 }))
    const sessions = entries.map((e) => ({ playedAt: new Date("2025-01-01"), gameId: e.gameId }))
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "collector")?.unlocked).toBe(true)
    expect(titles.find((t) => t.id === "professor")?.unlocked).toBe(false)
  })

  it("unlocks devoted when same game played 10+ times", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      playedAt: new Date(`2025-01-${String(i + 1).padStart(2, "0")}`),
      gameId: "g1",
    }))
    const entries = [{ gameId: "g1", rating: 5 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "devoted")?.unlocked).toBe(true)
  })

  it("unlocks weekly when 7 consecutive days", () => {
    const sessions = Array.from({ length: 7 }, (_, i) => ({
      playedAt: new Date(2025, 0, i + 1),
      gameId: "g1",
    }))
    const entries = [{ gameId: "g1", rating: 3 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "weekly")?.unlocked).toBe(true)
  })

  it("does not unlock weekly when days are non-consecutive", () => {
    const sessions = [
      { playedAt: new Date(2025, 0, 1), gameId: "g1" },
      { playedAt: new Date(2025, 0, 3), gameId: "g1" },
      { playedAt: new Date(2025, 0, 5), gameId: "g1" },
      { playedAt: new Date(2025, 0, 7), gameId: "g1" },
      { playedAt: new Date(2025, 0, 9), gameId: "g1" },
      { playedAt: new Date(2025, 0, 11), gameId: "g1" },
      { playedAt: new Date(2025, 0, 13), gameId: "g1" },
    ]
    const entries = [{ gameId: "g1", rating: 3 }]
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "weekly")?.unlocked).toBe(false)
  })

  it("unlocks connoisseur when avg rating >= 4.5 and 10+ unique games", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ gameId: `g${i}`, rating: 5 }))
    const sessions = entries.map((e) => ({ playedAt: new Date("2025-01-01"), gameId: e.gameId }))
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "connoisseur")?.unlocked).toBe(true)
  })

  it("does not unlock connoisseur with fewer than 10 unique games", () => {
    const entries = Array.from({ length: 9 }, (_, i) => ({ gameId: `g${i}`, rating: 5 }))
    const sessions = entries.map((e) => ({ playedAt: new Date("2025-01-01"), gameId: e.gameId }))
    const titles = calculateTitles({ entries, sessions })
    expect(titles.find((t) => t.id === "connoisseur")?.unlocked).toBe(false)
  })

  it("unlocks wishlist-dreamer when wishlistCount >= 3", () => {
    const titles = calculateTitles({ entries: noEntries, sessions: noSessions, wishlistCount: 3 })
    expect(titles.find((t) => t.id === "wishlist-dreamer")?.unlocked).toBe(true)
  })

  it("unlocks genre-explorer with 5+ unique categories", () => {
    const games = [
      { categories: "Fantasy, Horror, Adventure, Science Fiction, Medieval", mechanics: null },
    ]
    const entries = [{ gameId: "g1", rating: 4 }]
    const sessions = [{ playedAt: new Date("2025-01-01"), gameId: "g1" }]
    const titles = calculateTitles({ entries, sessions, games })
    expect(titles.find((t) => t.id === "genre-explorer")?.unlocked).toBe(true)
  })

  it("returns all titles with correct shape", () => {
    const titles = calculateTitles({ entries: noEntries, sessions: noSessions })
    expect(titles.length).toBeGreaterThan(0)
    titles.forEach((t) => {
      expect(t).toHaveProperty("id")
      expect(t).toHaveProperty("name")
      expect(t).toHaveProperty("icon")
      expect(t).toHaveProperty("description")
      expect(t).toHaveProperty("unlocked")
    })
  })
})
