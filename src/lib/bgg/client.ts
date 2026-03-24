import { XMLParser } from "fast-xml-parser"

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2"

const BGG_TOKEN = process.env.BGG_TOKEN

const BGG_HEADERS: Record<string, string> = {
  "User-Agent": "Boardory/1.0 (https://github.com/sahokk/board-log)",
  Accept: "application/xml",
  ...(BGG_TOKEN ? { Authorization: `Bearer ${BGG_TOKEN}` } : {}),
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
  htmlEntities: true,
})

function decodeEntities(str: string): string {
  return str
    .replaceAll(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function attrStr(val: unknown): string {
  if (val === null || val === undefined) return ""
  if (typeof val === "string") return decodeEntities(val)
  if (typeof val === "number") return String(val)
  if (typeof val === "object") {
    const v = (val as Record<string, unknown>)["@_value"]
    if (typeof v === "string") return decodeEntities(v)
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
  // ひらがな・カタカナが含まれれば確実に日本語
  const kanaPattern = /[\u3040-\u309F\u30A0-\u30FF]/

  // 漢字（CJK統合漢字）
  const kanjiPattern = /[\u4E00-\u9FFF]/

  // 簡体字中国語に特有な文字。
  // 日本語の対応漢字とは異なる Unicode コードポイントを持つ簡体字を列挙。
  // 例: 時(U+6642)は日本語 / 时(U+65F6)は簡体字のみ
  //     間(U+9593)は日本語 / 间(U+95F4)は簡体字のみ
  // ※ 国(U+56FD)・瀑・禽など日本語でも使う文字は除外
  const chineseLikePattern = new RegExp(
    "["
    // 簡体字の代名詞・助詞・助動詞（日本語には存在しない）
    + "\u8FD9"  // 这 (zhè: これ) ← 日本語: これ
    + "\u4EEC"  // 们 (men: 複数接尾辞)
    + "\u4E48"  // 么 (me: 語尾)
    // 日本語と別コードポイントを持つ簡体字（よく使われるもの）
    + "\u4E3A"  // 为 (wéi: ため) ← 日本語: 為(U+70BA)
    + "\u53D1"  // 发 (fā: 送る) ← 日本語: 発(U+767A)
    + "\u4E1C"  // 东 (dōng: 東) ← 日本語: 東(U+6771)
    + "\u4ECE"  // 从 (cóng: から) ← 日本語: 従(U+5F93)
    + "\u4EA7"  // 产 (chǎn: 産) ← 日本語: 産(U+7523)
    + "\u4E1A"  // 业 (yè: 業) ← 日本語: 業(U+696D)
    + "\u5BF9"  // 对 (duì: 対) ← 日本語: 対(U+5BFE)
    + "\u957F"  // 长 (cháng: 長) ← 日本語: 長(U+9577)
    + "\u95EE"  // 问 (wèn: 問) ← 日本語: 問(U+554F)
    + "\u8BDD"  // 话 (huà: 話) ← 日本語: 話(U+8A71)
    + "\u5F00"  // 开 (kāi: 開) ← 日本語: 開(U+958B)
    + "\u7535"  // 电 (diàn: 電) ← 日本語: 電(U+96FB)
    + "\u89C1"  // 见 (jiàn: 見) ← 日本語: 見(U+898B)
    + "\u8BF4"  // 说 (shuō: 言う) ← 日本語: 説(U+8AAC)
    + "\u8FC7"  // 过 (guò: 過) ← 日本語: 過(U+904E)
    + "\u8FB9"  // 边 (biān: 辺) ← 日本語: 辺(U+8FBA)
    + "\u8BA4"  // 认 (rèn: 認) ← 日本語: 認(U+8A8D)
    + "\u8BED"  // 语 (yǔ: 語) ← 日本語: 語(U+8A9E)
    + "\u8FD8"  // 还 (hái: まだ) ← 日本語: 還(U+9084)
    + "\u65F6"  // 时 (shí: 時) ← 日本語: 時(U+6642)
    + "\u52A8"  // 动 (dòng: 動) ← 日本語: 動(U+52D5)
    + "\u4F20"  // 传 (chuán: 伝) ← 日本語: 伝(U+4F1D)
    + "\u6218"  // 战 (zhàn: 戦) ← 日本語: 戦(U+6226)
    + "\u6C49"  // 汉 (hàn: 漢) ← 日本語: 漢(U+6F22)
    + "\u7231"  // 爱 (ài: 愛) ← 日本語: 愛(U+611B)
    + "\u8F66"  // 车 (chē: 車) ← 日本語: 車(U+8ECA)
    + "\u4E66"  // 书 (shū: 書) ← 日本語: 書(U+66F8)
    + "\u95E8"  // 门 (mén: 門) ← 日本語: 門(U+9580)
    + "\u620F"  // 戏 (xì: 戯) ← 日本語: 戯(U+622F)
    + "\u8680"  // 蚀 (shí: 蝕) ← 日本語: 蝕(U+8755)
    + "\u9669"  // 险 (xiǎn: 険) ← 日本語: 険(U+967A)
    + "\u98CE"  // 风 (fēng: 風) ← 日本語: 風(U+98A8)
    + "\u95F4"  // 间 (jiān: 間) ← 日本語: 間(U+9593)
    + "\u9E70"  // 鹰 (yīng: 鷹) ← 日本語: 鷹(U+9DF9)
    + "\u8F49"  // 轉 (Traditional: 転) ← 日本語: 転(U+8EE2)
    + "\u6B22"  // 欢 (huān: 歓) ← 日本語: 歓(U+6B53)
    + "\u8FDB"  // 进 (jìn: 進) ← 日本語: 進(U+9032)
    + "\u7ED9"  // 给 (gěi: 給) ← 日本語: 給(U+7D66)
    + "\u7EBF"  // 线 (xiàn: 線) ← 日本語: 線(U+7DDA)
    + "\u7EA7"  // 级 (jí: 級) ← 日本語: 級(U+7D1A)
    + "\u7ED3"  // 结 (jié: 結) ← 日本語: 結(U+7D50)
    + "\u7EFF"  // 绿 (lǜ: 緑) ← 日本語: 緑(U+7DD1)
    + "\u7ECF"  // 经 (jīng: 経) ← 日本語: 経(U+7D4C)
    + "\u7C7B"  // 类 (lèi: 類) ← 日本語: 類(U+985E)
    + "\u961F"  // 队 (duì: 隊) ← 日本語: 隊(U+968A)
    + "\u52A1"  // 务 (wù: 務) ← 日本語: 務(U+52D9)
    + "]"
  )

  const kanaMatch = names.find((n) => kanaPattern.test(attrStr(n["@_value"])))
  if (kanaMatch) return attrStr(kanaMatch["@_value"])

  const kanjiMatch = names.find((n) => {
    const val = attrStr(n["@_value"])
    return kanjiPattern.test(val) && !chineseLikePattern.test(val)
  })
  if (kanjiMatch) return attrStr(kanjiMatch["@_value"])

  return undefined
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
