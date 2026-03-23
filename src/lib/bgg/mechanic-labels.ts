/**
 * BGGメカニクス名 → ボドゲーマカテゴリの日本語情報を返すヘルパー。
 *
 * データソース:
 *   src/data/bgg-to-bodogamer.json   BGGメカニクス名 → ボドゲーマID[]
 *   src/data/bodogamer-mechanics.json  ボドゲーマID → jaName/shortDesc
 */

import bggToBodogamer from "@/data/bgg-to-bodogamer.json"
import bodogamerMechanicsRaw from "@/data/bodogamer-mechanics.json"

interface BodoGamerMechanic {
  id: number
  jaName: string
  shortDesc: string
}

const byId = new Map<number, BodoGamerMechanic>(
  (bodogamerMechanicsRaw as BodoGamerMechanic[]).map((m) => [m.id, m])
)
const mapping = bggToBodogamer as Record<string, number[]>

/** BGGメカニクス名 → ボドゲーマカテゴリの日本語名（最初のカテゴリ、なければ undefined） */
export function getMechanicJaName(bggName: string): string | undefined {
  const ids = mapping[bggName]
  if (!ids?.length) return undefined
  return byId.get(ids[0])?.jaName
}

/** BGGメカニクス名 → ボドゲーマカテゴリの短い説明（最初のカテゴリ、なければ undefined） */
export function getMechanicShortDesc(bggName: string): string | undefined {
  const ids = mapping[bggName]
  if (!ids?.length) return undefined
  return byId.get(ids[0])?.shortDesc
}

/** BGGメカニクス名に対応するボドゲーマカテゴリが存在するか */
export function hasMechanicMapping(bggName: string): boolean {
  return !!mapping[bggName]?.length
}
