#!/usr/bin/env npx tsx
/**
 * ボドゲーマの日本語メカニクス説明を mechanic-descriptions.json にマージするスクリプト。
 *
 * 処理フロー:
 *   1. bodogamer-mechanics.json (ボドゲーマのスクレイピング結果) を読み込み
 *   2. BGGメカニクス名 → ボドゲーマID のマッピングを適用
 *   3. mechanic-descriptions.json の descriptionJa フィールドを更新
 *
 * 使い方:
 *   npx tsx scripts/merge-mechanic-descriptions.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"
import type { BodoGamerMechanic } from "./fetch-bodogamer-mechanics"
import type { MechanicDescription } from "./fetch-mechanic-descriptions"

// ============================================================
// BGGメカニクス名 → ボドゲーマID マッピング
// ============================================================
// 複数の BGG 名が同じボドゲーマ ID を指す場合あり

const BGG_TO_BODOGAMER: Record<string, number> = {
  // ダイス
  "Dice Rolling":              5,
  // タイル
  "Tile Placement":            6,
  // 三すくみ
  "Rock-Paper-Scissors":       8,
  // ブラフ
  "Bluffing":                  9,
  "Betting and Bluffing":      9,
  // 路線・ネットワーク形成
  "Route/Network Building":    13,
  "Network and Route Building": 13,
  // 記憶
  "Memory":                    15,
  // エリアマジョリティ
  "Area Majority / Influence": 16,
  "Area Control":              16,
  // 正体隠匿
  "Hidden Roles":              18,
  "Social Deduction":          18,
  "Traitor Game":              18,
  // ドラフト各種
  "Drafting":                  96,
  "Card Drafting":             96,
  "Open Drafting":             96,
  "Closed Drafting":           96,
  "Action Drafting":           96,
  // 言葉遊び
  "Word Game":                 21,
  // 交渉
  "Negotiation":               22,
  // 交換/貿易
  "Trading":                   23,
  // モジュラーボード
  "Modular Board":             25,
  // アクションポイント
  "Action Points":             26,
  // バースト・プッシュユアラック
  "Push Your Luck":            27,
  // 投票
  "Voting":                    30,
  // セットコレクション
  "Set Collection":            33,
  // 協力プレイ
  "Cooperative Game":          34,
  "Semi-Cooperative Game":     34,
  "Team-Based Game":           66,
  // 直接攻撃
  "Take That":                 41,
  // 推理
  "Deduction":                 44,
  // ハンドマネージメント
  "Hand Management":           45,
  // ストーリーメイキング
  "Storytelling":              48,
  // バリアブルフェーズオーダー
  "Variable Phase Order":      55,
  // プレイヤー別固有能力
  "Variable Player Powers":    56,
  // ワーカープレイスメント
  "Worker Placement":          58,
  // デッキビルディング
  "Deck Building":             59,
  "Deck Construction":         59,
  "Deck, Bag, and Pool Building": 59,
  // エンクロージャ（囲み）
  "Enclosure":                 67,
  // エリア移動
  "Area Movement":             68,
  // バトルカード
  "Campaign / Battle Card Driven": 70,
  // グリッド移動
  "Grid Movement":             75,
  // パターンビルディング
  "Pattern Building":          78,
  // パターン認識
  "Pattern Recognition":       79,
  // プレイヤーの脱落
  "Player Elimination":        80,
  // ポイントツーポイント移動
  "Point to Point Movement":   81,
  "Pick-up and Deliver":       81,
  "Pickup and Deliver":        81,
  // ロールプレイ
  "Role Playing":              83,
  // 出目移動
  "Roll / Spin and Move":      84,
  // 隠蔽ユニット
  "Hidden Movement":           85,
  // 同時アクション選択
  "Simultaneous Action Selection": 87,
  // リアルタイム
  "Real-Time":                 97,
  "Speed Matching":            97,
  // コミュニケーション禁止
  "Communication Limits":      98,
  // オークション
  "Auction / Bidding":         2,
  "Auction/Bidding":           2,
  "Bidding":                   2,
  // アブストラクト
  "Abstract Strategy":         94,
  "Induction":                 94,
  // フィジカル
  "Physical":                  37,
  // キャラクター担当
  "Acting":                    83,
  // バッティング（同時宣言のペナルティ）→ 囚人のジレンマと近い
  "Prisoner's Dilemma":        95,
  // チキンレース（リスク増大）→ Push Your Luckと近いが King of the Hill も同系
  "King of the Hill":          82,
}

async function main() {
  console.log("\nメカニクス説明マージスクリプト")
  console.log("=".repeat(50))

  const bodogamerPath = path.join(process.cwd(), "src/data/bodogamer-mechanics.json")
  const descriptionsPath = path.join(process.cwd(), "src/data/mechanic-descriptions.json")

  if (!fs.existsSync(bodogamerPath)) {
    console.error("❌ bodogamer-mechanics.json が見つかりません。先に fetch-bodogamer-mechanics.ts を実行してください。")
    process.exit(1)
  }

  // ボドゲーマデータをIDでインデックス
  const bdgList: BodoGamerMechanic[] = JSON.parse(fs.readFileSync(bodogamerPath, "utf-8"))
  const bdgById = new Map(bdgList.map((m) => [m.id, m]))
  console.log(`ボドゲーマデータ: ${bdgList.length} 件`)

  // 既存の mechanic-descriptions.json を読み込み
  let descriptions: Record<string, MechanicDescription> = {}
  if (fs.existsSync(descriptionsPath)) {
    descriptions = JSON.parse(fs.readFileSync(descriptionsPath, "utf-8"))
    console.log(`既存説明データ: ${Object.keys(descriptions).length} 件`)
  }

  // mechanics-map.json から全メカニクス名を取得
  const mechanicsMapPath = path.join(process.cwd(), "src/data/mechanics-map.json")
  const mechanicsMap: Record<string, unknown> = JSON.parse(fs.readFileSync(mechanicsMapPath, "utf-8"))
  const allMechanics = new Set([
    ...Object.keys(mechanicsMap),
    ...Object.keys(descriptions),
  ])

  let updated = 0
  let notMapped = 0

  for (const bggName of allMechanics) {
    const bdgId = BGG_TO_BODOGAMER[bggName]
    if (!bdgId) {
      notMapped++
      continue
    }

    const bdgMechanic = bdgById.get(bdgId)
    if (!bdgMechanic) continue

    const existing = descriptions[bggName] ?? { bggId: "", description: "" }
    descriptions[bggName] = {
      ...existing,
      descriptionJa: bdgMechanic.shortDesc,
    }
    updated++
  }

  console.log(`\nマッピング適用: ${updated} 件`)
  console.log(`未マッピング: ${notMapped} 件`)

  // 未マッピングのメカニクスを表示
  const unmapped = [...allMechanics].filter((name) => !BGG_TO_BODOGAMER[name])
  if (unmapped.length > 0) {
    console.log(`\n未マッピングのメカニクス (${unmapped.length} 件):`)
    for (const name of unmapped.sort()) {
      const has = descriptions[name]?.descriptionJa ? " (既存あり)" : ""
      console.log(`  - ${name}${has}`)
    }
  }

  // ソートして保存
  const sorted = Object.fromEntries(
    Object.entries(descriptions).sort(([a], [b]) => a.localeCompare(b))
  )
  fs.writeFileSync(descriptionsPath, JSON.stringify(sorted, null, 2), "utf-8")
  console.log(`\n✓ ${Object.keys(sorted).length} 件を保存: ${descriptionsPath}`)

  // ボドゲーマ側で未使用のIDを報告
  const usedIds = new Set(Object.values(BGG_TO_BODOGAMER))
  const unusedBdg = bdgList.filter((m) => !usedIds.has(m.id))
  if (unusedBdg.length > 0) {
    console.log(`\nボドゲーマ未使用メカニクス (参考):`)
    for (const m of unusedBdg) {
      console.log(`  ID ${m.id}: ${m.jaName} — ${m.shortDesc}`)
    }
  }
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
