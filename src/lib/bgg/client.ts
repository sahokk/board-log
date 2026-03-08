import { XMLParser } from "fast-xml-parser"

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name"].includes(name),
})

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
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`BGG search failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.slice(0, 20).map((item: unknown) => {
    const i = item as Record<string, unknown>
    const names = (i.name as Record<string, unknown>[]) ?? []
    const primary = names.find((n) => n["@_type"] === "primary")
    const year = (i.yearpublished as Record<string, unknown>)?.["@_value"]

    return {
      id: String(i["@_id"]),
      name: String(primary?.["@_value"] ?? names[0]?.["@_value"] ?? ""),
      yearPublished: year ? Number(year) : undefined,
    }
  })
}

// ゲーム詳細取得（画像URL含む、複数一括）
export async function getBggGameDetails(ids: string[]): Promise<BggGameDetail[]> {
  if (ids.length === 0) return []

  const url = `${BGG_API_BASE}/thing?id=${ids.join(",")}`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`BGG thing failed: ${res.status}`)

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>
    const names = (i.name as Record<string, unknown>[]) ?? []
    const primary = names.find((n) => n["@_type"] === "primary")
    const year = (i.yearpublished as Record<string, unknown>)?.["@_value"]

    return {
      id: String(i["@_id"]),
      name: String(primary?.["@_value"] ?? names[0]?.["@_value"] ?? ""),
      yearPublished: year ? Number(year) : undefined,
      imageUrl: normalizeImageUrl(i.image as string | undefined),
      thumbnailUrl: normalizeImageUrl(i.thumbnail as string | undefined),
    }
  })
}
