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
    swatch: "#c4778a",
    leftBg: "linear-gradient(160deg, #6b2737 0%, #c4778a 55%, #f0b8c8 100%)",
    footerBg: "linear-gradient(135deg, #6b2737 0%, #c4778a 100%)",
    accentColor: "#fdeef3",
    accentMuted: "rgba(253,238,243,0.75)",
    decorRgb: "220,120,150",
  },
  {
    id: "lavender",
    name: "ラベンダー",
    swatch: "#9b72cf",
    leftBg: "linear-gradient(160deg, #3d2060 0%, #9b72cf 55%, #d8baee 100%)",
    footerBg: "linear-gradient(135deg, #3d2060 0%, #9b72cf 100%)",
    accentColor: "#f5eeff",
    accentMuted: "rgba(245,238,255,0.75)",
    decorRgb: "180,130,230",
  },
  {
    id: "mint",
    name: "ミント",
    swatch: "#6ab09a",
    leftBg: "linear-gradient(160deg, #1e5c48 0%, #6ab09a 55%, #b8e8d8 100%)",
    footerBg: "linear-gradient(135deg, #1e5c48 0%, #6ab09a 100%)",
    accentColor: "#e8f8f3",
    accentMuted: "rgba(232,248,243,0.75)",
    decorRgb: "120,200,170",
  },
  {
    id: "peach",
    name: "ピーチ",
    swatch: "#d4906e",
    leftBg: "linear-gradient(160deg, #7a3828 0%, #d4906e 55%, #f5c8a8 100%)",
    footerBg: "linear-gradient(135deg, #7a3828 0%, #d4906e 100%)",
    accentColor: "#fef0e6",
    accentMuted: "rgba(254,240,230,0.75)",
    decorRgb: "220,150,110",
  },
]

export function getTheme(id: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]
}
