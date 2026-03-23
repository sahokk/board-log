#!/usr/bin/env npx tsx
/**
 * BGGメカニクスの説明文を取得して src/data/mechanic-descriptions.json に保存するスクリプト。
 *
 * 処理フロー:
 *   1. analyze-mechanics.ts と同じゲームリストを BGG から取得
 *   2. 各ゲームの mechanic リンクから「メカニクス名 → BGG ID」を収集
 *   3. mechanics-map.json に含まれるメカニクスに絞り込み
 *   4. BGG /xmlapi2/family?id=... で説明文を取得
 *   5. src/data/mechanic-descriptions.json に保存
 *
 * 翻訳を追加したい場合:
 *   npm install @anthropic-ai/sdk
 *   .env.local に ANTHROPIC_API_KEY=sk-ant-... を追加
 *   このスクリプト末尾のコメントを参照
 *
 * 使い方:
 *   npx tsx scripts/fetch-mechanic-descriptions.ts
 */

import { XMLParser } from "fast-xml-parser"
import * as fs from "node:fs"
import * as path from "node:path"

// ============================================================
// 設定
// ============================================================

// analyze-mechanics.ts と同じゲームリスト（重複除去済み）
const GAME_IDS = [
  "174430","342942","224517","12333","37111","182028","115746","96848",
  "162886","62219","31260","124361","72125","169786","167791","237182",
  "220308","281549","266192","36218","28143","199792","316554","68448",
  "173346","127023","135666","128621","3076","2651","183394","205637",
  "291293","246900","177736","111341","125153","198928","255681","215",
  "9209","822","133473","129622","148228","230802","295947","70919",
  "39856","262543","279537","312572","274637","192135","13","11",
  "178900","254640","217372","178635","67877","45","155426","188834",
  "147949","92415","131357","250458","216132","180263","63268","8811",
  "148203","244521","58110","30549","98778","84876","193037","220294",
  "65244","70323","41","29544","2243","69395","111325","163412",
  "39463","188006","24480","172","126042","154","171","463","42",
  "1534","136063","178027","181304","2040","6931","3519","1406",
  "2452","1294","658","2484","140934","228604",
]

const UNIQUE_IDS = [...new Set(GAME_IDS)]

const BGG_API = "https://boardgamegeek.com/xmlapi2"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
  htmlEntities: true,
})

// ============================================================
// .env.local 読み込み
// ============================================================

function readEnvLocal(): Record<string, string> {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8")
    const result: Record<string, string> = {}
    for (const line of raw.split("\n")) {
      const m = line.match(/^(\w+)="?([^"\n]+)"?/)
      if (m) result[m[1]] = m[2]
    }
    return result
  } catch { return {} }
}

const env = readEnvLocal()
const BGG_TOKEN = env["BGG_TOKEN"]

// ============================================================
// ユーティリティ
// ============================================================

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function bggHeaders() {
  return {
    "User-Agent": "Boardory/1.0 (https://github.com/sahokk/board-log)",
    Accept: "application/xml",
    ...(BGG_TOKEN ? { Authorization: `Bearer ${BGG_TOKEN}` } : {}),
  }
}

// ============================================================
// Step 1: ゲームデータからメカニクスID収集
// ============================================================

async function fetchGameBatch(ids: string[], retry = 0): Promise<Map<string, string>> {
  const url = `${BGG_API}/thing?id=${ids.join(",")}`
  let res: Response

  try {
    res = await fetch(url, { headers: bggHeaders() })
  } catch {
    if (retry < 3) { await sleep(3000); return fetchGameBatch(ids, retry + 1) }
    return new Map()
  }

  if (res.status === 429 || res.status === 503) {
    await sleep((retry + 1) * 5000)
    return fetchGameBatch(ids, retry + 1)
  }
  if (!res.ok) { console.warn(`  game fetch error: ${res.status}`); return new Map() }

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []

  // メカニクス名 → BGG ID のマッピングを収集
  const mechanicIds = new Map<string, string>()
  for (const item of items) {
    const links = ((item as Record<string, unknown>).link as Record<string, unknown>[]) ?? []
    for (const link of links) {
      if (link["@_type"] === "boardgamemechanic") {
        const name = attrStr(link["@_value"])
        const id   = attrStr(link["@_id"])
        if (name && id) mechanicIds.set(name, id)
      }
    }
  }
  return mechanicIds
}

async function collectMechanicIds(gameIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const BATCH = 20

  for (let i = 0; i < gameIds.length; i += BATCH) {
    const batch = gameIds.slice(i, i + BATCH)
    process.stdout.write(`  Scanning games ${i + 1}-${Math.min(i + BATCH, gameIds.length)} / ${gameIds.length}...`)
    const ids = await fetchGameBatch(batch)
    for (const [name, id] of ids) result.set(name, id)
    console.log(` found ${ids.size} mechanics`)
    if (i + BATCH < gameIds.length) await sleep(1200)
  }
  return result
}

// ============================================================
// Step 2: BGG family API でメカニクス説明文を取得
// ============================================================

async function fetchMechanicDescription(bggId: string, retry = 0): Promise<string> {
  const url = `${BGG_API}/family?id=${bggId}`
  let res: Response

  try {
    res = await fetch(url, { headers: bggHeaders() })
  } catch {
    if (retry < 3) { await sleep(3000); return fetchMechanicDescription(bggId, retry + 1) }
    return ""
  }

  if (res.status === 429 || res.status === 503) {
    await sleep((retry + 1) * 5000)
    return fetchMechanicDescription(bggId, retry + 1)
  }
  if (!res.ok) return ""

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed.items?.item ?? []
  if (items.length === 0) return ""

  const item = items[0] as Record<string, unknown>
  const desc = item.description as string | undefined
  return typeof desc === "string" ? desc.trim() : ""
}

// ============================================================
// メイン
// ============================================================

export interface MechanicDescription {
  bggId: string
  description: string
  descriptionJa?: string  // 翻訳後に追加（translate-mechanics.ts を参照）
}

async function main() {
  console.log("\nBGGメカニクス説明文取得スクリプト")
  console.log("=".repeat(50))

  // mechanics-map.json からターゲットメカニクス名を取得
  const mechanicsMapPath = path.join(process.cwd(), "src/data/mechanics-map.json")
  const mechanicsMap: Record<string, unknown> = JSON.parse(fs.readFileSync(mechanicsMapPath, "utf-8"))
  const targetMechanics = new Set(Object.keys(mechanicsMap))
  console.log(`\nターゲットメカニクス数: ${targetMechanics.size}`)

  // 既存の出力ファイルを読み込み（増分更新対応）
  const outputPath = path.join(process.cwd(), "src/data/mechanic-descriptions.json")
  let existing: Record<string, MechanicDescription> = {}
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, "utf-8"))
    console.log(`既存データ: ${Object.keys(existing).length} 件`)
  }

  // Step 1: ゲームデータからメカニクスID収集
  console.log("\n[Step 1] ゲームデータからメカニクスIDを収集...")
  const mechanicIds = await collectMechanicIds(UNIQUE_IDS)
  console.log(`収集されたメカニクスID数: ${mechanicIds.size}`)

  // ターゲットのうちIDが取れたものに絞り込み
  const toFetch: Array<{ name: string; id: string }> = []
  for (const name of targetMechanics) {
    const id = mechanicIds.get(name)
    if (id) {
      toFetch.push({ name, id })
    } else {
      console.warn(`  ⚠ ID not found: ${name}`)
    }
  }
  console.log(`説明文取得対象: ${toFetch.length} メカニクス`)

  // Step 2: 説明文を取得（未取得のもの + descriptionが空のもの）
  const needFetch = toFetch.filter(
    ({ name }) => !existing[name]?.description
  )
  console.log(`\n[Step 2] 説明文を取得 (${needFetch.length} 件)...`)

  const result: Record<string, MechanicDescription> = { ...existing }

  for (let i = 0; i < needFetch.length; i++) {
    const { name, id } = needFetch[i]
    process.stdout.write(`  [${i + 1}/${needFetch.length}] ${name}...`)

    const description = await fetchMechanicDescription(id)
    result[name] = {
      bggId: id,
      description,
      ...(existing[name]?.descriptionJa ? { descriptionJa: existing[name].descriptionJa } : {}),
    }

    if (description) {
      console.log(` ✓ (${description.length} chars)`)
    } else {
      console.log(" ✗ (empty)")
    }

    await sleep(1000)
  }

  // 既存のIDを補完（description はあるが bggId がないもの）
  for (const { name, id } of toFetch) {
    if (result[name] && !result[name].bggId) {
      result[name].bggId = id
    }
  }

  // 保存
  const sorted = Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  )
  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), "utf-8")
  console.log(`\n✓ ${Object.keys(sorted).length} 件を保存: ${outputPath}`)

  // 取得できなかったメカニクスを報告
  const missing = [...targetMechanics].filter((name) => !result[name]?.description)
  if (missing.length > 0) {
    console.log(`\n⚠ 説明文が空のメカニクス (${missing.length} 件):`)
    for (const name of missing) console.log(`  - ${name}`)
  }

  console.log("\n次のステップ:")
  console.log("  日本語訳を追加: npm install @anthropic-ai/sdk を実行後、")
  console.log("  .env.local に ANTHROPIC_API_KEY=sk-ant-... を追加し、")
  console.log("  npx tsx scripts/translate-mechanic-descriptions.ts を実行")
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
