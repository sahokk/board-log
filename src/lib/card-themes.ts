export interface CardTheme {
  id: string
  name: string
  swatch: string         // CSS color for the swatch circle
  leftBg: string         // Left panel background gradient
  footerBg: string       // Footer background gradient
  accentColor: string    // Tagline / subtitle text color
  accentMuted: string    // Muted accent (labels, divider)
  decorRgb: string       // RGB for decorative circle radial gradients
}

export const CARD_THEMES: CardTheme[] = [
  // ── Classic ──────────────────────────────────────────────
  {
    id: "amber",
    name: "アンバー",
    swatch: "#78350f",
    leftBg: "linear-gradient(160deg, #451a03 0%, #78350f 55%, #92400e 100%)",
    footerBg: "linear-gradient(135deg, #451a03 0%, #78350f 100%)",
    accentColor: "#fde68a",
    accentMuted: "rgba(253,230,138,0.6)",
    decorRgb: "217,119,6",
  },
  {
    id: "forest",
    name: "フォレスト",
    swatch: "#14532d",
    leftBg: "linear-gradient(160deg, #052e16 0%, #14532d 55%, #166534 100%)",
    footerBg: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
    accentColor: "#bbf7d0",
    accentMuted: "rgba(187,247,208,0.6)",
    decorRgb: "34,197,94",
  },
  {
    id: "ocean",
    name: "オーシャン",
    swatch: "#1e3a8a",
    leftBg: "linear-gradient(160deg, #0c1a3a 0%, #1e3a6e 55%, #1d4ed8 100%)",
    footerBg: "linear-gradient(135deg, #0c1a3a 0%, #1e3a6e 100%)",
    accentColor: "#bfdbfe",
    accentMuted: "rgba(191,219,254,0.6)",
    decorRgb: "59,130,246",
  },
  {
    id: "purple",
    name: "パープル",
    swatch: "#4c1d95",
    leftBg: "linear-gradient(160deg, #2e1065 0%, #4c1d95 55%, #6d28d9 100%)",
    footerBg: "linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)",
    accentColor: "#ddd6fe",
    accentMuted: "rgba(221,214,254,0.6)",
    decorRgb: "139,92,246",
  },
  {
    id: "midnight",
    name: "ミッドナイト",
    swatch: "#1e293b",
    leftBg: "linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
    footerBg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accentColor: "#e2e8f0",
    accentMuted: "rgba(226,232,240,0.6)",
    decorRgb: "148,163,184",
  },
  {
    id: "crimson",
    name: "クリムゾン",
    swatch: "#7f1d1d",
    leftBg: "linear-gradient(160deg, #450a0a 0%, #7f1d1d 55%, #991b1b 100%)",
    footerBg: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)",
    accentColor: "#fecaca",
    accentMuted: "rgba(254,202,202,0.6)",
    decorRgb: "239,68,68",
  },
  // ── Pastel / Cute ─────────────────────────────────────────
  {
    id: "sakura",
    name: "さくら",
    swatch: "#be185d",
    leftBg: "linear-gradient(160deg, #881337 0%, #be185d 55%, #fbcfe8 100%)",
    footerBg: "linear-gradient(135deg, #881337 0%, #be185d 100%)",
    accentColor: "#fce7f3",
    accentMuted: "rgba(252,231,243,0.7)",
    decorRgb: "236,72,153",
  },
  {
    id: "lavender",
    name: "ラベンダー",
    swatch: "#a855f7",
    leftBg: "linear-gradient(160deg, #4a044e 0%, #a855f7 55%, #f0abfc 100%)",
    footerBg: "linear-gradient(135deg, #4a044e 0%, #a855f7 100%)",
    accentColor: "#fae8ff",
    accentMuted: "rgba(250,232,255,0.7)",
    decorRgb: "217,70,239",
  },
  {
    id: "aqua",
    name: "アクア",
    swatch: "#0891b2",
    leftBg: "linear-gradient(160deg, #164e63 0%, #0891b2 55%, #a5f3fc 100%)",
    footerBg: "linear-gradient(135deg, #164e63 0%, #0891b2 100%)",
    accentColor: "#cffafe",
    accentMuted: "rgba(207,250,254,0.7)",
    decorRgb: "6,182,212",
  },
  {
    id: "lemon",
    name: "レモン",
    swatch: "#ca8a04",
    leftBg: "linear-gradient(160deg, #3a2000 0%, #a16207 55%, #fef08a 100%)",
    footerBg: "linear-gradient(135deg, #3a2000 0%, #a16207 100%)",
    accentColor: "#fefce8",
    accentMuted: "rgba(254,252,232,0.7)",
    decorRgb: "234,179,8",
  },
]

export function getTheme(id: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]
}
