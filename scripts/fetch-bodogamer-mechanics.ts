#!/usr/bin/env npx tsx
/**
 * ボドゲーマ (bodoge.hoobby.net) からメカニクスの日本語名・説明文を取得して
 * src/data/bodogamer-mechanics.json に保存するスクリプト。
 *
 * 取得内容:
 *   - id: ボドゲーマのメカニクスID
 *   - jaName: 日本語メカニクス名 (og:titleの「」内)
 *   - shortDesc: 短い説明文 (og:description)
 *
 * 使い方:
 *   npx tsx scripts/fetch-bodogamer-mechanics.ts
 *
 * 次ステップ:
 *   scripts/merge-mechanic-descriptions.ts を実行して
 *   BGGメカニクス名 → ボドゲーマ日本語説明のマッピングを生成
 */

import * as fs from "node:fs"
import * as path from "node:path"

const BASE_URL = "https://bodoge.hoobby.net"
const OUTPUT_PATH = path.join(process.cwd(), "src/data/bodogamer-mechanics.json")

export interface BodoGamerMechanic {
  id: number
  jaName: string
  shortDesc: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function extractMeta(html: string, property: string): string {
  // Try og: property
  const ogMatch = html.match(new RegExp(`property="${property}"\\s+content="([^"]*)"`, "i"))
    ?? html.match(new RegExp(`content="([^"]*)"\\s+property="${property}"`, "i"))
  if (ogMatch) return ogMatch[1].trim()
  // Try name= property
  const nameMatch = html.match(new RegExp(`name="${property}"\\s+content="([^"]*)"`, "i"))
    ?? html.match(new RegExp(`content="([^"]*)"\\s+name="${property}"`, "i"))
  if (nameMatch) return nameMatch[1].trim()
  return ""
}

function extractJaName(ogTitle: string): string {
  // ogTitle format: 「メカニクス名」の人気ボードゲーム TOP20
  const m = ogTitle.match(/「([^」]+)」/)
  return m ? m[1] : ogTitle
}

async function fetchMechanic(id: number, retry = 0): Promise<BodoGamerMechanic | null> {
  const url = `${BASE_URL}/mechanics/${id}`
  let res: Response

  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Boardory/1.0 (https://github.com/sahokk/board-log)",
        "Accept": "text/html",
        "Accept-Language": "ja,en;q=0.9",
      },
    })
  } catch {
    if (retry < 3) { await sleep(3000); return fetchMechanic(id, retry + 1) }
    return null
  }

  if (res.status === 429 || res.status === 503) {
    await sleep((retry + 1) * 5000)
    return fetchMechanic(id, retry + 1)
  }
  if (res.status === 404) return null
  if (!res.ok) { console.warn(`  status ${res.status} for /mechanics/${id}`); return null }

  const html = await res.text()
  const ogTitle = extractMeta(html, "og:title")
  const ogDesc  = extractMeta(html, "og:description")

  if (!ogTitle) return null

  return {
    id,
    jaName: extractJaName(ogTitle),
    shortDesc: ogDesc,
  }
}

async function fetchAllMechanicsIds(): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/mechanics`, {
    headers: {
      "User-Agent": "Boardory/1.0",
      "Accept": "text/html",
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch mechanics list: ${res.status}`)
  const html = await res.text()
  const ids = new Set<number>()
  const re = /href="\/mechanics\/(\d+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    ids.add(parseInt(m[1], 10))
  }
  return [...ids].sort((a, b) => a - b)
}

async function main() {
  console.log("\nボドゲーマ メカニクス取得スクリプト")
  console.log("=".repeat(50))

  // 既存データを読み込み（増分更新対応）
  let existing: Record<number, BodoGamerMechanic> = {}
  if (fs.existsSync(OUTPUT_PATH)) {
    const arr: BodoGamerMechanic[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"))
    for (const m of arr) existing[m.id] = m
    console.log(`既存データ: ${arr.length} 件`)
  }

  // メカニクスID一覧を取得
  console.log("\nメカニクスID一覧を取得中...")
  const ids = await fetchAllMechanicsIds()
  console.log(`取得ID数: ${ids.length}`)

  const needFetch = ids.filter((id) => !existing[id])
  console.log(`取得対象: ${needFetch.length} 件\n`)

  const results: BodoGamerMechanic[] = Object.values(existing)

  for (let i = 0; i < needFetch.length; i++) {
    const id = needFetch[i]
    process.stdout.write(`  [${i + 1}/${needFetch.length}] /mechanics/${id}...`)
    const mechanic = await fetchMechanic(id)
    if (mechanic) {
      results.push(mechanic)
      console.log(` ✓ ${mechanic.jaName}`)
    } else {
      console.log(" ✗ (取得失敗)")
    }
    if (i + 1 < needFetch.length) await sleep(800)
  }

  // IDでソートして保存
  results.sort((a, b) => a.id - b.id)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8")
  console.log(`\n✓ ${results.length} 件を保存: ${OUTPUT_PATH}`)

  console.log("\n次のステップ:")
  console.log("  npx tsx scripts/merge-mechanic-descriptions.ts")
  console.log("  を実行して BGGメカニクス名 → 日本語説明のマッピングを生成")
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
