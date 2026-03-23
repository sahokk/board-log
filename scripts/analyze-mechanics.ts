#!/usr/bin/env npx tsx
/**
 * BGGデータを分析し、mechanics-map.json の重みを統計的に導出するスクリプト。
 *
 * アプローチ:
 *   各メカニクスについて BGG のゲームデータから以下を算出:
 *     - avg_weight      : そのメカニクスを持つゲームの平均複雑さ (1-5)
 *     - pct_cooperative : Cooperative Game カテゴリに含まれる割合
 *     - pct_wargame     : Wargame カテゴリに含まれる割合（対戦性の代理変数）
 *     - pct_party       : Party Game カテゴリに含まれる割合
 *     - pct_dice        : Dice カテゴリに含まれる割合（運要素の代理変数）
 *
 *   これらの統計値から各中間カテゴリへの貢献度（1-3）を自動算出する。
 *
 * 使い方:
 *   npx tsx scripts/analyze-mechanics.ts
 *
 * 出力:
 *   - コンソールに統計テーブルを表示
 *   - src/data/mechanics-map.generated.json に推奨値を書き出し
 */

import { XMLParser } from "fast-xml-parser"
import * as fs from "node:fs"
import * as path from "node:path"

// ============================================================
// 分析対象ゲームID（多様なタイプをカバーする約250タイトル）
//
// 各ゲームの種別:
//   [H] Heavy strategy  [M] Medium strategy  [L] Light/Family
//   [C] Cooperative     [P] Party/Social      [D] Dice/Luck
//   [W] Wargame/Area    [E] Engine/Deck       [N] Negotiation
// ============================================================
const GAME_IDS = [
  // Heavy Strategy / Wargame
  "174430", // Gloomhaven              [H]
  "342942", // Ark Nova                [H]
  "224517", // Brass: Birmingham       [H]
  "12333",  // Twilight Struggle       [H][W]
  "37111",  // Twilight Imperium 4     [H][W]
  "182028", // Through the Ages        [H]
  "115746", // War of the Ring         [H][W]
  "96848",  // Mage Knight             [H]
  "162886", // Spirit Island           [H][C]
  "62219",  // Dominant Species        [H][W]
  "31260",  // Agricola                [H]
  "124361", // Concordia               [H]
  "72125",  // Eclipse                 [H][W]
  "169786", // Scythe                  [H][W]
  "167791", // Terraforming Mars       [H][E]
  "237182", // Root                    [H][W]
  "187645", // Spirit Island           (dup guard)
  "220308", // Gaia Project            [H]
  "169786", // Scythe                  (dup guard)
  "281549", // John Company 2e         [H]

  // Medium Strategy / Engine Building
  "266192", // Wingspan                [M][E]
  "36218",  // Dominion                [M][E]
  "28143",  // Race for the Galaxy     [M][E]
  "199792", // Everdell                [M][E]
  "316554", // Dune: Imperium          [M][E]
  "291457", // Wingspan European Exp   (skip - expansion)
  "68448",  // 7 Wonders               [M]
  "173346", // 7 Wonders Duel          [M]
  "127023", // Five Tribes             [M]
  "135666", // Viticulture             [M][E]
  "182028", // Through the Ages        (dup guard)
  "161936", // Pandemic Legacy S1      [M][C]
  "128621", // Viticulture Ess Ed      [M][E]
  "3076",   // Puerto Rico             [M]
  "2651",   // Power Grid              [M]
  "263918", // Wingspan               (dup guard)
  "291025", // Wingspan               (dup guard)
  "310873", // Wingspan               (dup guard)
  "209010", // Pandemic Legacy S2      [M][C]
  "256680", // Too Many Bones          [H][C]
  "262712", // Gloomhaven Jaws         [M][C]

  // Area Control / Direct Conflict
  "187645", // Spirit Island           [H][C][W]
  "183394", // Pax Pamir 2e            [H][W]
  "205637", // Inis                    [M][W]
  "291293", // Oath                    [H][W]
  "246900", // Tapestry                [M]
  "177736", // Great Western Trail     [H]

  // Deck / Card Building
  "111341", // Legendary (Marvel)      [M][E][C]
  "125153", // Ascension               [M][E]
  "198928", // Aeon's End              [M][E][C]
  "255681", // Arkham Horror LCG       [H][C]
  "215",    // Arkham Horror 2e        [H][C]
  "172818", // Aeon's End              (dup guard)

  // Light / Family
  "9209",   // Ticket to Ride          [L]
  "822",    // Carcassonne             [L]
  "133473", // Sushi Go!               [L]
  "129622", // Love Letter             [L]
  "148228", // Splendor                [L]
  "230802", // Azul                    [L]
  "295947", // Cascadia                [L]
  "70919",  // Takenoko                [L]
  "39856",  // Dixit                   [L][P]
  "262543", // Wavelength              [L][P]
  "279537", // Sagrada                 [L][D]
  "312572", // Cartographers           [L]
  "274637", // Welcome To              [L]
  "192135", // Sagrada                 (dup guard)
  "13",     // Catan                   [L][N]
  "11",     // Bohnanza                [L][N]

  // Party / Social
  "178900", // Codenames               [P]
  "254640", // Just One                [P]
  "10547",  // Dixit                   (dup guard)
  "217372", // Decrypto                [P]
  "178635", // Deception: Murder       [P]
  "67877",  // Anomia                  [P][S]
  "45",     // Apples to Apples        [P]
  "155426", // Insider                 [P]
  "263918", // Wavelength              (dup guard)

  // Social Deduction / Bluffing
  "188834", // Secret Hitler           [P][S]
  "147949", // One Night Werewolf      [P][S]
  "92415",  // Skull                   [P][S]
  "131357", // Coup                    [P][S]
  "250458", // One Night Alien         [P][S]
  "216132", // Codenames Duet          [P][C]
  "180263", // Mysterium               [P][C]

  // Speed / Real-time
  "63268",  // Dobble / Spot It        [S][P]
  "8811",   // Jungle Speed            [S][P]
  "148203", // Dutch Blitz             [S][P]
  "244521", // Pandemic: Rapid Resp    [S][C]
  "58110",  // Space Alert             [H][C][S]

  // Cooperative
  "30549",  // Pandemic                [C]
  "98778",  // Hanabi                  [C]
  "84876",  // Flash Point             [M][C]
  "193037", // The Grizzled            [L][C]
  "220294", // Forbidden Island        [L][C]
  "65244",  // Forbidden Island        (dup guard)
  "233078", // Spirit Island           (dup guard)
  "190458", // Mysterium               (dup guard)

  // Dice / Luck
  "70323",  // King of Tokyo           [D]
  "41",     // Can't Stop              [D]
  "29544",  // Zombie Dice             [D][P]
  "2243",   // Yahtzee                 [D]
  "69395",  // To Court the King       [D]
  "111325", // Castles of Burgundy     [M][D]
  "110327", // King of Tokyo           (dup guard)
  "163412", // Pandemic: Cure          [D][C]

  // Negotiation / Trading
  "39463",  // Cosmic Encounter        [N]
  "188006", // Sheriff of Nottingham   [N][P]
  "24480",  // Space Dealer            [N]
  "172",    // Pit                     [N][P]
  "126042", // Nations                 [H]

  // Abstract Strategy
  "154",    // Hive                    [A]
  "171",    // Chess                   [A]
  "463",    // Go                      [A]
  "42",     // Stratego                [A]
  "1534",   // Othello/Reversi         [A]

  // Light Cooperative (追加: 協力ゲームのサンプルを増やす)
  "136063", // Forbidden Desert        [L][C]
  "65244",  // Forbidden Island        [L][C]
  "178027", // The Game                [L][C]
  "181304", // Mysterium               [L][C]
  "2040",   // Balderdash              [P]
  "6931",   // Werewolf                [P][S]
  "3519",   // Bang!                   [P][S]

  // Dice / Luck 追加
  "1406",   // Monopoly                [D][L]
  "2452",   // Jenga                   [P][D]
  "1294",   // Clue / Cluedo           [L]
  "658",    // Taboo                   [P]
  "2484",   // Pictionary              [P]
  "140934", // Sushi Go Party!         [L]

  // Roll and Write
  "274637", // Welcome To              [L]
  "228604", // Ganz schon clever       [D]
]

// dedup
const UNIQUE_IDS = [...new Set(GAME_IDS)]

// ============================================================
// BGG API
// ============================================================

const BGG_API = "https://boardgamegeek.com/xmlapi2"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
  htmlEntities: true,
})

interface GameData {
  id: string
  weight: number | null
  categories: string[]
  mechanics: string[]
}

function attrStr(val: unknown): string {
  if (!val) return ""
  if (typeof val === "string") return val
  if (typeof val === "number") return String(val)
  if (typeof val === "object") {
    const v = (val as Record<string, unknown>)["@_value"]
    if (typeof v === "string") return v
    if (typeof v === "number") return String(v)
    return ""
  }
  return ""
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// .env.local から BGG_TOKEN を読み込む
const BGG_TOKEN = (() => {
  try {
    const env = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8")
    const match = env.match(/^BGG_TOKEN="?([^"\n]+)"?/m)
    return match?.[1]
  } catch { return undefined }
})()

async function fetchBatch(ids: string[], retry = 0): Promise<GameData[]> {
  const url = `${BGG_API}/thing?id=${ids.join(",")}&stats=1`
  let res: Response

  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Boardory/1.0 (https://github.com/sahokk/board-log)",
        Accept: "application/xml",
        ...(BGG_TOKEN ? { Authorization: `Bearer ${BGG_TOKEN}` } : {}),
      },
    })
  } catch (e) {
    if (retry < 3) {
      console.log(`  Network error, retry ${retry + 1}...`)
      await sleep(3000)
      return fetchBatch(ids, retry + 1)
    }
    throw e
  }

  if (res.status === 429 || res.status === 503) {
    const wait = (retry + 1) * 5000
    console.log(`  Rate limited (${res.status}), waiting ${wait / 1000}s...`)
    await sleep(wait)
    return fetchBatch(ids, retry + 1)
  }

  if (!res.ok) throw new Error(`BGG API error: ${res.status} for ${url}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>
    const links = (i.link as Record<string, unknown>[]) ?? []

    const categories = links
      .filter((l) => l["@_type"] === "boardgamecategory")
      .map((l) => attrStr(l["@_value"]))

    const mechanics = links
      .filter((l) => l["@_type"] === "boardgamemechanic")
      .map((l) => attrStr(l["@_value"]))

    const stats = i.statistics as Record<string, unknown> | undefined
    const ratings = stats?.ratings as Record<string, unknown> | undefined
    const weightStr = attrStr(ratings?.averageweight)
    const weight = weightStr ? Number.parseFloat(weightStr) : null

    return {
      id: attrStr(i["@_id"]),
      weight: weight && weight > 0 ? weight : null,
      categories,
      mechanics,
    }
  })
}

async function fetchAllGames(ids: string[]): Promise<GameData[]> {
  const BATCH_SIZE = 20
  const games: GameData[] = []

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    process.stdout.write(`Fetching ${i + 1}-${Math.min(i + BATCH_SIZE, ids.length)} / ${ids.length}...`)
    const results = await fetchBatch(batch)
    games.push(...results)
    console.log(` got ${results.length} games`)
    if (i + BATCH_SIZE < ids.length) await sleep(1500)
  }

  return games
}

// ============================================================
// 統計計算
// ============================================================

/**
 * BGGシグナル分類:
 *
 * isWargame  : BGGカテゴリ "Wargame" または "Fighting"（直接対人衝突）
 *              ※ "Abstract Strategy" / "Economic" は除外（協調ゲームも多い）
 * isCoop     : BGGメカニクス に "Cooperative Game" または "Team-Based Game" を含む
 *              ※ BGGでは "Cooperative Game" はカテゴリではなくメカニクス
 * isParty    : BGGカテゴリ "Party Game" / "Children's Game" / "Word Game"
 * isDice     : BGGカテゴリ "Dice" / "Roll and Write"
 */
const WARGAME_CATEGORIES = new Set(["Wargame", "Fighting"])
const COOP_MECHANICS     = new Set(["Cooperative Game", "Team-Based Game"])
const PARTY_CATEGORIES   = new Set(["Party Game", "Children's Game", "Word Game"])
const DICE_CATEGORIES    = new Set(["Dice", "Roll and Write"])

interface MechanicStats {
  count: number
  avgWeight: number       // 1.0-5.0
  pctWargame: number      // Wargame/competitive カテゴリ割合
  pctCooperative: number  // Cooperative カテゴリ割合
  pctParty: number        // Party Game カテゴリ割合
  pctDice: number         // Dice カテゴリ割合
}

type RawMechanicEntry = {
  count: number; weightSum: number; weightCount: number
  wargame: number; cooperative: number; party: number; dice: number
}

function emptyEntry(): RawMechanicEntry {
  return { count: 0, weightSum: 0, weightCount: 0, wargame: 0, cooperative: 0, party: 0, dice: 0 }
}

function accumulateEntry(entry: RawMechanicEntry, game: GameData, flags: Record<string, boolean>) {
  entry.count++
  if (game.weight !== null) { entry.weightSum += game.weight; entry.weightCount++ }
  if (flags.isWargame) entry.wargame++
  if (flags.isCoop) entry.cooperative++
  if (flags.isParty) entry.party++
  if (flags.isDice) entry.dice++
}

function toMechanicStats(s: RawMechanicEntry): MechanicStats {
  return {
    count: s.count,
    avgWeight: s.weightCount > 0 ? s.weightSum / s.weightCount : 2.5,
    pctWargame: s.wargame / s.count,
    pctCooperative: s.cooperative / s.count,
    pctParty: s.party / s.count,
    pctDice: s.dice / s.count,
  }
}

function computeStats(games: GameData[]): Map<string, MechanicStats> {
  const raw = new Map<string, RawMechanicEntry>()

  for (const game of games) {
    const flags = {
      isWargame: game.categories.some((c) => WARGAME_CATEGORIES.has(c)),
      isCoop:    game.mechanics.some((m) => COOP_MECHANICS.has(m)),
      isParty:   game.categories.some((c) => PARTY_CATEGORIES.has(c)),
      isDice:    game.categories.some((c) => DICE_CATEGORIES.has(c)),
    }
    for (const mechanic of game.mechanics) {
      const entry = raw.get(mechanic) ?? emptyEntry()
      if (!raw.has(mechanic)) raw.set(mechanic, entry)
      accumulateEntry(entry, game, flags)
    }
  }

  const result = new Map<string, MechanicStats>()
  for (const [mechanic, s] of raw) {
    if (s.count >= 3) result.set(mechanic, toMechanicStats(s))
  }
  return result
}

// ============================================================
// 統計 → 中間カテゴリ重みへの変換
//
// 根拠:
//   STRATEGY/ENGINE   : avg_weight が高いゲームに多く登場 → 重さの代理変数
//   COOP              : Cooperative Game カテゴリ率
//   INTERACTION       : Wargame カテゴリ率 - Cooperative カテゴリ率（純粋な対戦性）
//   PARTY             : Party Game カテゴリ率
//   LUCK              : Dice カテゴリ率 × 低重量補正
//   SPEED             : 判定困難（カテゴリ信号なし）→ 手動管理
//   SOCIAL            : Party + Cooperative の中間信号
// ============================================================

type IntermediateCategory = "STRATEGY" | "ENGINE" | "CONTROL" | "LUCK" | "INTERACTION" | "SOCIAL" | "COOP" | "PARTY" | "SPEED"

// avg_weight → STRATEGY/ENGINE/CONTROL への貢献
function deriveDepth(mechanic: string, w: number): Partial<Record<IntermediateCategory, number>> {
  const isEngine  = /deck|engine|tableau|bag/i.test(mechanic)
  const isControl = /resource|hand management|set collection|market|pickup|income|contract/i.test(mechanic)
  const out: Partial<Record<IntermediateCategory, number>> = {}

  const depthKey: IntermediateCategory = isEngine ? "ENGINE" : "STRATEGY"
  if (w >= 3.5)      out[depthKey] = 3
  else if (w >= 2.8) out[depthKey] = 2
  else if (w >= 2.2) out[depthKey] = 1

  if (isControl && w >= 2) {
    out["CONTROL"] = w >= 3 ? 2 : 1
    if (out["STRATEGY"]) out["STRATEGY"] = Math.max(1, (out["STRATEGY"] ?? 0) - 1)
  }
  return out
}

// カテゴリ出現率 → 重み（0.5/0.25/0.12 の閾値）
function pctToWeight(pct: number): number {
  if (pct >= 0.5) return 3
  if (pct >= 0.25) return 2
  if (pct >= 0.12) return 1
  return 0
}

// Wargame率 - Cooperative率 → INTERACTION
function deriveInteraction(pctWar: number, pctCoop: number): number {
  const net = pctWar - pctCoop * 0.5
  if (net >= 0.5) return 3
  if (net >= 0.25) return 2
  if (net >= 0.12) return 1
  return 0
}

// Dice率 × 低重量補正 → LUCK
function deriveLuck(pctDice: number, w: number): number {
  const weightBonus = Math.max(0, (2.5 - w) / 2.5)
  const signal = pctDice * 0.7 + weightBonus * 0.3
  if (signal >= 0.45 || pctDice >= 0.5) return 3
  if (signal >= 0.25) return 2
  if (signal >= 0.12) return 1
  return 0
}

// メカニクス名 → SPEED（BGGにSpeed専用カテゴリがないため名前ベース）
function deriveSpeed(mechanic: string): number {
  if (/real.time|speed matching/i.test(mechanic)) return 3
  if (/pattern recognition/i.test(mechanic)) return 2
  if (/memory/i.test(mechanic)) return 1
  return 0
}

function deriveMapping(mechanic: string, stats: MechanicStats): Partial<Record<IntermediateCategory, number>> {
  const mapping: Partial<Record<IntermediateCategory, number>> = {
    ...deriveDepth(mechanic, stats.avgWeight),
  }

  const coop = pctToWeight(stats.pctCooperative)
  if (coop) mapping["COOP"] = coop

  const interaction = deriveInteraction(stats.pctWargame, stats.pctCooperative)
  if (interaction) mapping["INTERACTION"] = interaction

  // SOCIAL: Social Deduction / Bluffing / Hidden Roles 等は名前ベースで判定
  if (/social deduction|bluffing|hidden roles|role playing|storytelling|acting|communication/i.test(mechanic)) {
    mapping["SOCIAL"] = 3
    if (!mapping["INTERACTION"]) mapping["INTERACTION"] = 1
  }

  const party = pctToWeight(stats.pctParty)
  if (party) mapping["PARTY"] = party

  const luck = deriveLuck(stats.pctDice, stats.avgWeight)
  if (luck) mapping["LUCK"] = luck

  const speed = deriveSpeed(mechanic)
  if (speed) mapping["SPEED"] = speed

  return mapping
}

// ============================================================
// メイン
// ============================================================

async function main() {
  console.log(`\nBGGメカニクス分析スクリプト`)
  console.log(`対象ゲーム数: ${UNIQUE_IDS.length}\n`)

  const games = await fetchAllGames(UNIQUE_IDS)
  console.log(`\n取得完了: ${games.length} ゲーム\n`)

  const stats = computeStats(games)
  console.log(`メカニクス数（サンプル3以上）: ${stats.size}\n`)

  // ── 統計テーブル出力 ──────────────────────────────────────────
  console.log("Mechanic                              | n  | avgW | %war | %coop | %party | %dice | → mapping")
  console.log("-".repeat(110))

  const sortedStats = [...stats.entries()].sort((a, b) => b[1].count - a[1].count)
  const output: Record<string, Partial<Record<IntermediateCategory, number>>> = {}

  for (const [mechanic, s] of sortedStats) {
    const mapping = deriveMapping(mechanic, s)
    if (Object.keys(mapping).length === 0) continue

    output[mechanic] = mapping

    const mapStr = Object.entries(mapping)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ")
    console.log(
      `${mechanic.substring(0, 36).padEnd(37)}| ${String(s.count).padStart(2)} | ${s.avgWeight.toFixed(2)} | ${pct(s.pctWargame)} | ${pct(s.pctCooperative)} | ${pct(s.pctParty)}  | ${pct(s.pctDice)} | ${mapStr}`
    )
  }

  // ── 出力 ────────────────────────────────────────────────────
  const outputPath = path.join(process.cwd(), "src/data/mechanics-map.generated.json")
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8")

  console.log(`\n推奨マッピングを出力: ${outputPath}`)
  console.log("内容を確認し、src/data/mechanics-map.json に反映してください。")
  console.log("\n注意:")
  console.log("  - SPEED 系（Real-Time など）は名前ベースで判定（BGGにSpeed専用カテゴリなし）")
  console.log("  - ENGINEとSTRATEGYは名前パターンで分岐（'Deck/Engine/Tableau'を含むか）")
  console.log("  - サンプル数が少ないメカニクスは手動チェック推奨")
}

function pct(v: number): string {
  return `${(v * 100).toFixed(0).padStart(3)}%`
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
