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
  isArray: (name) => ["item", "name"].includes(name),
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

function resolveName(names: Record<string, unknown>[]): string {
  const primary = names.find((n) => n["@_type"] === "primary")
  return attrStr(primary?.["@_value"]) || attrStr(names[0]?.["@_value"])
}

export interface BggSearchItem {
  id: string
  name: string
  yearPublished?: number
}

export interface BggGameDetail {
  id: string
  name: string
  yearPublished?: number
  imageUrl?: string
  thumbnailUrl?: string
}

function normalizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith("//")) return `https:${url}`
  return url
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

// ゲーム詳細取得（画像URL含む、複数一括）
export async function getBggGameDetails(ids: string[]): Promise<BggGameDetail[]> {
  if (ids.length === 0) return []

  const url = `${BGG_API_BASE}/thing?id=${ids.join(",")}`
  const res = await fetch(url, { headers: BGG_HEADERS, next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`BGG thing failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>
    const names = (i.name as Record<string, unknown>[]) ?? []
    const year = (i.yearpublished as Record<string, unknown>)?.["@_value"]

    return {
      id: String(i["@_id"]),
      name: resolveName(names),
      yearPublished: year ? Number(year) : undefined,
      imageUrl: normalizeImageUrl(i.image as string | undefined),
      thumbnailUrl: normalizeImageUrl(i.thumbnail as string | undefined),
    }
  })
}
