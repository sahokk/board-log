import { XMLParser } from "fast-xml-parser"

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2"

const BGG_TOKEN = process.env.BGG_TOKEN

const BGG_HEADERS: Record<string, string> = {
  "User-Agent": "BoardLog/1.0 (https://github.com/sahokk/board-log)",
  Accept: "application/xml",
  ...(BGG_TOKEN ? { Authorization: `Bearer ${BGG_TOKEN}` } : {}),
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
})

function attrStr(val: unknown): string {
  if (val === null || val === undefined) return ""
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

function attrNum(val: unknown): number | undefined {
  const s = attrStr(val)
  if (!s) return undefined
  const n = Number(s)
  return Number.isNaN(n) || n === 0 ? undefined : n
}

function resolveName(names: Record<string, unknown>[]): string {
  const primary = names.find((n) => n["@_type"] === "primary")
  return attrStr(primary?.["@_value"]) || attrStr(names[0]?.["@_value"])
}

function resolveJaName(names: Record<string, unknown>[]): string | undefined {
  const jaPattern = /[\u3040-\u9FFF]/
  const jaName = names.find((n) => n["@_type"] === "alternate" && jaPattern.test(attrStr(n["@_value"])))
  return jaName ? attrStr(jaName["@_value"]) : undefined
}

function normalizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith("//")) return `https:${url}`
  return url
}

export interface BggSearchItem {
  id: string
  name: string
  yearPublished?: number
}

export interface BggGameDetail {
  id: string
  name: string
  nameJa?: string        // 日本語名（alternate nameより）
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
  categories: string[]   // boardgamecategory
  mechanics: string[]    // boardgamemechanic
  weight?: number        // averageweight 1.0〜5.0
  playingTime?: number   // 分
  minPlayers?: number
  maxPlayers?: number
}

// ゲーム検索（名前・ID一覧を返す）
export async function searchBggGames(query: string): Promise<BggSearchItem[]> {
  const url = `${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame`
  const res = await fetch(url, { headers: BGG_HEADERS, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`BGG search failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.slice(0, 20).map((item: unknown) => {
    const i = item as Record<string, unknown>
    const names = (i.name as Record<string, unknown>[]) ?? []
    const year = (i.yearpublished as Record<string, unknown>)?.["@_value"]

    return {
      id: String(i["@_id"]),
      name: resolveName(names),
      yearPublished: year ? Number(year) : undefined,
    }
  })
}

export interface BggHotItem {
  id: string
  name: string
  yearPublished?: number
  thumbnailUrl?: string
}

// BGGホットゲーム取得（上位50件）
export async function getBggHotGames(): Promise<BggHotItem[]> {
  const url = `${BGG_API_BASE}/hot?type=boardgame`
  const res = await fetch(url, { headers: BGG_HEADERS, next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`BGG hot failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>
    return {
      id: String(i["@_id"]),
      name: attrStr(i.name),
      yearPublished: attrNum(i.yearpublished),
      thumbnailUrl: normalizeImageUrl(attrStr(i.thumbnail) || undefined),
    }
  })
}

// ゲーム詳細取得（stats=1でweight取得）
export async function getBggGameDetails(ids: string[]): Promise<BggGameDetail[]> {
  if (ids.length === 0) return []

  const url = `${BGG_API_BASE}/thing?id=${ids.join(",")}&stats=1`
  const res = await fetch(url, { headers: BGG_HEADERS, next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`BGG thing failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>
    const names = (i.name as Record<string, unknown>[]) ?? []
    const year = (i.yearpublished as Record<string, unknown>)?.["@_value"]
    const links = (i.link as Record<string, unknown>[]) ?? []

    // カテゴリ・メカニクス
    const categories = links
      .filter((l) => l["@_type"] === "boardgamecategory")
      .map((l) => String(l["@_value"]))
    const mechanics = links
      .filter((l) => l["@_type"] === "boardgamemechanic")
      .map((l) => String(l["@_value"]))

    // 複雑度（averageweight）
    const stats = i.statistics as Record<string, unknown> | undefined
    const ratings = stats?.ratings as Record<string, unknown> | undefined
    const weightVal = attrStr((ratings?.averageweight as Record<string, unknown> | undefined))
    const weight = weightVal ? Number.parseFloat(weightVal) : undefined

    return {
      id: String(i["@_id"]),
      name: resolveName(names),
      nameJa: resolveJaName(names),
      yearPublished: year ? Number(year) : undefined,
      imageUrl: normalizeImageUrl(i.image as string | undefined),
      thumbnailUrl: normalizeImageUrl(i.thumbnail as string | undefined),
      categories,
      mechanics,
      weight: weight && weight > 0 ? weight : undefined,
      playingTime: attrNum(i.playingtime),
      minPlayers: attrNum(i.minplayers),
      maxPlayers: attrNum(i.maxplayers),
    }
  })
}
